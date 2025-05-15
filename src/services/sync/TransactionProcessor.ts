import {handlers, HandlerMap} from './handlers';
import {Transaction} from '../../types/transaction';
import {queryClient} from '../../services/queryClient';
import {db, pendingTransactions} from '../database';

export class TransactionProcessor {
  private async processTransaction(tx: Transaction) {
    const HandlerClass = handlers[tx.entityType as keyof HandlerMap];
    console.log('STARTED TRANSACTION FOR ', tx.entityType);
    if (!HandlerClass) {
      throw new Error(`No handler for entity type: ${tx.entityType}`);
    }

    const payload = JSON.parse(tx.payload);
    let serverId: string | undefined;

    try {
      switch (tx.type) {
        case 'create':
          const created = await HandlerClass.create(payload);
          serverId = created.id;
          console.log('----> CREATED: ', serverId);
          break;

        case 'delete':
          await HandlerClass.delete(payload.serverId);
          break;
      }

      await this.updateLocalState(tx, serverId);
      this.invalidateQueries(tx.entityType);
    } catch (error) {
      await this.handleTransactionError(
        tx.id,
        error,
        tx.entityType,
        tx.entityId,
      );
      throw error;
    }
  }

  private async updateLocalState(tx: Transaction, serverId?: string) {
    await db.transaction(async sqlTx => {
      console.log(
        '----> UPDATING LOCAL STATE FOR: ',
        tx.entityType,
        serverId,
        tx.entityId,
      );
      if (tx.type === 'create' && serverId) {
        await sqlTx.executeSql(
          `UPDATE ${tx.entityType} 
           SET server_id = ?, status = 'synced', version = version + 1 
           WHERE id = ?`,
          [serverId, tx.entityId],
        );
        await db.executeSql(
          `UPDATE transactions SET status = 'committed' WHERE id = ?`,
          [tx.id],
        );
      }

      if (tx.type === 'delete') {
        await sqlTx.executeSql(`DELETE FROM transactions WHERE id = ?`, [
          tx.id,
        ]);

        await sqlTx.executeSql(`DELETE FROM ${tx.entityType} WHERE id = ?`, [
          tx.entityId,
        ]);
      }
    });
  }

  private invalidateQueries(entityType: string) {
    queryClient.invalidateQueries({queryKey: [`${entityType}`]});
  }

  private async handleTransactionError(
    txId: string,
    error: unknown,
    entityType: string,
    entityId: string,
  ) {
    console.error(
      `Transaction ${txId} in ${entityType} id: ${entityId} failed:`,
      error,
    );
    await db.executeSql(
      `UPDATE transactions SET retries = retries + 1 WHERE id = ?`,
      [txId],
    );
  }

  public async processPendingTransactions() {
    const transactions = await pendingTransactions.getPendingTransactions();

    for (const tx of transactions) {
      await this.processTransaction(tx);
    }
  }
}
