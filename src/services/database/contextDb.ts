import {LocalContext} from '../../types/context';
import {db} from '../database';

export const getContexts = async (): Promise<LocalContext[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM contexts WHERE status != "deleted" ORDER BY created_at DESC',
        [],
        (_, result) => resolve(result.rows.raw()),
        (_, error) => reject(error),
      );
    });
  });
};

export const createContextTransaction = async (
  name: string,
): Promise<string> => {
  const contextId = `local_${Date.now()}`;
  const txId = `tx_${Date.now()}`;

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          `INSERT INTO transactions 
          (id, type, entityType, entityId, payload, createdAt) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            txId,
            'create',
            'contexts',
            contextId,
            JSON.stringify({name}),
            Date.now(),
          ],
        );

        tx.executeSql(
          `INSERT INTO contexts 
          (id, name, status, created_at) 
          VALUES (?, ?, ?, ?)`,
          [contextId, name, 'pending', Date.now()],
        );
      },
      error => reject(error),
      () => resolve(),
    );
  });
  return txId;
};

export const deleteContextTransaction = async (
  item: LocalContext,
): Promise<string> => {
  const txId = `tx_${Date.now()}`;

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          `INSERT INTO transactions 
            (id, type, entityType, entityId, payload, createdAt) 
            VALUES (?, ?, ?, ?, ?, ?)`,
          [
            txId,
            'delete',
            'contexts',
            item.id,
            JSON.stringify({serverId: item.server_id}),
            Date.now(),
          ],
        );

        tx.executeSql(`UPDATE contexts SET status = 'deleted' WHERE id = ?`, [
          item.id,
        ]);
      },
      error => reject(error),
      () => resolve(),
    );
  });

  return txId;
};
