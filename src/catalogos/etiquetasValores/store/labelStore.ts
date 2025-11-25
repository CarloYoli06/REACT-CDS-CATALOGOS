// src/catalogos/etiquetasValores/store/labelStore.ts
import { TableParentRow, TableSubRow } from "../services/labelService";

export type Action = 'CREATE' | 'UPDATE' | 'DELETE' | 'NONE';

export interface Operation {
  id?: string;
  collection: 'labels' | 'values';
  action: Action;
  payload: any;
  originalValues?: any;
}

let operations: Operation[] = [];
let labels: TableParentRow[] = [];
let listeners: (() => void)[] = [];

export const subscribe = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const getLabels = () => labels;

export const setLabels = (newLabels: TableParentRow[]) => {
  labels = newLabels;
  notifyListeners();
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const updateLocalState = (operation: Operation) => {
  if (operation.collection === 'labels' && operation.action === 'CREATE') {
    const newLabel: TableParentRow = {
      parent: true,
      idsociedad: operation.payload.IDSOCIEDAD.toString(),
      idcedi: operation.payload.IDCEDI.toString(),
      idetiqueta: operation.payload.IDETIQUETA,
      etiqueta: operation.payload.ETIQUETA,
      indice: operation.payload.INDICE,
      coleccion: operation.payload.COLECCION,
      seccion: operation.payload.SECCION,
      secuencia: operation.payload.SECUENCIA,
      imagen: operation.payload.IMAGEN,
      ruta: operation.payload.ROUTE,
      descripcion: operation.payload.DESCRIPCION,
      status: 'Positive',
      subRows: [],
    };
    labels = [...labels, newLabel];
  } else if (operation.collection === 'labels' && operation.action === 'UPDATE') {
    const targetId = operation.payload.id;
    const updates = operation.payload.updates;

    labels = labels.map(label => {
      if (label.idetiqueta === targetId) {
        // FIC: Preserve 'Positive' status if it was a new item, otherwise set to 'Warning'
        const newStatus = label.status === 'Positive' ? 'Positive' : 'Critical';
        console.log('newStatus', newStatus);
        // FIC: Cascade visual update for IDETIQUETA
        let newSubRows = label.subRows;
        if (updates.IDETIQUETA) {
            newSubRows = label.subRows.map(sub => ({
                ...sub,
                idetiqueta: updates.IDETIQUETA
            }));
        }

        return {
          ...label,
          idsociedad: updates.IDSOCIEDAD !== undefined? updates.IDSOCIEDAD.toString() : label.idsociedad,
          idcedi: updates.IDCEDI !== undefined ? updates.IDCEDI.toString() : label.idcedi,
          idetiqueta: updates.IDETIQUETA !== undefined ? updates.IDETIQUETA : label.idetiqueta,
          etiqueta: updates.ETIQUETA !== undefined ? updates.ETIQUETA : label.etiqueta,
          indice: updates.INDICE !== undefined ? updates.INDICE : label.indice,
          coleccion: updates.COLECCION !== undefined ? updates.COLECCION : label.coleccion,
          seccion: updates.SECCION !== undefined ? updates.SECCION : label.seccion,
          secuencia: updates.SECUENCIA !== undefined ? updates.SECUENCIA : label.secuencia,
          imagen: updates.IMAGEN !== undefined ? updates.IMAGEN : label.imagen,
          ruta: updates.ROUTE !== undefined ? updates.ROUTE : label.ruta,
          descripcion: updates.DESCRIPCION !== undefined ? updates.DESCRIPCION : label.descripcion,
          status: newStatus,
          subRows: newSubRows
        };
      }
      return label;
    });

  } else if (operation.collection === 'labels' && operation.action === 'DELETE') {
    const targetId = operation.payload.id;
    labels = labels.map(label => {
      if (label.idetiqueta === targetId) {
        return {
          ...label,
          status: 'Negative',
        };
      }
      return label;
    });

  } else if (operation.collection === 'values' && operation.action === 'CREATE') {
    const parentId = operation.payload.IDETIQUETA;
    labels = labels.map(label => {
      if (label.idetiqueta === parentId && label.parent) {
        const newSubRow = {
          parent: false,
          idsociedad: operation.payload.IDSOCIEDAD.toString(),
          idcedi: operation.payload.IDCEDI.toString(),
          idetiqueta: operation.payload.IDETIQUETA,
          indice: label.indice,
          coleccion: label.coleccion,
          seccion: label.seccion,
          idvalor: operation.payload.IDVALOR,
          valor: operation.payload.VALOR,
          idvalorpa: operation.payload.IDVALORPA,
          alias: operation.payload.ALIAS,
          secuencia: operation.payload.SECUENCIA,
          imagen: operation.payload.IMAGEN,
          ruta: operation.payload.ROUTE,
          descripcion: operation.payload.DESCRIPCION,
          status: 'Positive',
        };
        return {
          ...label,
          subRows: [...label.subRows, newSubRow] as TableSubRow[]
        };
      }
      return label;
    });
  } else if (operation.collection === 'values' && operation.action === 'UPDATE') {
    const valorId = operation.payload.id;
    const parentId = operation.payload.IDETIQUETA;
    const updates = operation.payload.updates;

    if (!parentId || !valorId) return;

    labels = labels.map(label => {
      if (label.idetiqueta === parentId && label.parent) {
        const updatedSubRows = label.subRows.map(subRow => {
          if (subRow.idvalor === valorId) {
             // FIC: Preserve 'Positive' status if it was a new item
            const newStatus = subRow.status === 'Positive' ? 'Positive' : 'Critical';
            return {
              ...subRow,
              idvalor: updates.IDVALOR !== undefined ? updates.IDVALOR : subRow.idvalor,
              valor: updates.VALOR !== undefined ? updates.VALOR : subRow.valor,
              idsociedad: updates.IDSOCIEDAD !== undefined ? updates.IDSOCIEDAD.toString() : subRow.idsociedad,
              idcedi: updates.IDCEDI !== undefined ? updates.IDCEDI.toString() : subRow.idcedi,
              idvalorpa: updates.IDVALORPA !== undefined ? updates.IDVALORPA : subRow.idvalorpa,
              alias: updates.ALIAS !== undefined ? updates.ALIAS : subRow.alias,
              secuencia: updates.SECUENCIA !== undefined ? updates.SECUENCIA : subRow.secuencia,
              descripcion: updates.DESCRIPCION !== undefined ? updates.DESCRIPCION : subRow.descripcion,
              imagen: updates.IMAGEN !== undefined ? updates.IMAGEN : subRow.imagen,
              ruta: updates.ROUTE !== undefined ? updates.ROUTE : subRow.ruta,
              status: newStatus,
            } as TableSubRow;
          }
          return subRow;
        });
        return { ...label, subRows: updatedSubRows };
      }
      return label;
    });
  } else if (operation.collection === 'values' && operation.action === 'DELETE') {
    const valorId = operation.payload.id;
    const parentId = operation.payload.IDETIQUETA;
    labels = labels.map(label => {
      if (label.idetiqueta === parentId && label.parent) {
        const updatedSubRows = label.subRows.map(subRow => {
          if (subRow.idvalor === valorId) {
            return { ...subRow, status: 'Negative' };
          }
          return subRow;
        });
        return { ...label, subRows: updatedSubRows };
      }
      return label;
    });
  }
};

const refreshStatuses = () => {
  // 1. Reset all statuses to 'None' (or base state)
  labels = labels.map(label => ({
    ...label,
    status: 'None',
    subRows: label.subRows.map(sub => ({ ...sub, status: 'None' }))
  }));

  // 2. Apply statuses based on active operations
  operations.forEach(op => {
    const action = op.action;
    const collection = op.collection;
    // Determine target ID. 
    // For CREATE, payload usually has the ID. For UPDATE/DELETE, payload.id is the target.
    // However, the payload structure varies. 
    // CREATE Label: payload.IDETIQUETA
    // CREATE Value: payload.IDVALOR
    // UPDATE/DELETE: payload.id
    
    let targetId: string | undefined;
    let parentId: string | undefined;

    if (action === 'CREATE') {
        targetId = collection === 'labels' ? op.payload.IDETIQUETA : op.payload.IDVALOR;
        parentId = collection === 'values' ? op.payload.IDETIQUETA : undefined;
    } else {
        targetId = op.payload.id;
        parentId = collection === 'values' ? op.payload.IDETIQUETA : undefined;
    }

    if (!targetId) return;

    if (collection === 'labels') {
        labels = labels.map(l => {
            if (l.idetiqueta === targetId) {
                let newStatus = l.status;
                if (action === 'CREATE') newStatus = 'Positive';
                else if (action === 'UPDATE') newStatus = l.status === 'Positive' ? 'Positive' : 'Critical';
                else if (action === 'DELETE') newStatus = 'Negative';
                
                return { ...l, status: newStatus };
            }
            return l;
        });
    } else if (collection === 'values' && parentId) {
        labels = labels.map(l => {
            if (l.idetiqueta === parentId) {
                const newSubRows = l.subRows.map(sub => {
                    if (sub.idvalor === targetId) {
                        let newStatus = sub.status;
                        if (action === 'CREATE') newStatus = 'Positive';
                        else if (action === 'UPDATE') newStatus = sub.status === 'Positive' ? 'Positive' : 'Critical';
                        else if (action === 'DELETE') newStatus = 'Negative';
                        return { ...sub, status: newStatus };
                    }
                    return sub;
                });
                return { ...l, subRows: newSubRows };
            }
            return l;
        });
    }
  });
};

export const addOperation = (operation: Operation) => {
  const opId = operation.id || generateId();
  const opWithId: Operation = { ...operation, id: opId };
  let merged = false;

  const targetId = opWithId.payload.id || (opWithId.collection === 'labels' ? opWithId.payload.IDETIQUETA : opWithId.payload.IDVALOR);
  const collection = opWithId.collection;

  // 1. Handle DELETE
  if (opWithId.action === 'DELETE') {
    // Check if a DELETE operation already exists for this ID
    const existingDeleteIndex = operations.findIndex(op =>
        op.action === 'DELETE' &&
        op.collection === collection &&
        op.payload.id === targetId
    );

    if (existingDeleteIndex !== -1) {
        console.log('Operación DELETE ya existe para:', targetId);
        return; // Ignore duplicate delete
    }

    // A. Check for CREATE (Undo Create)
    const createOpIndex = operations.findIndex(op =>
      op.action === 'CREATE' &&
      op.collection === collection &&
      (collection === 'labels' ? op.payload.IDETIQUETA : op.payload.IDVALOR) === targetId
    );

    if (createOpIndex !== -1) {
      console.log('Eliminando operación CREATE pendiente (Undo Create) para:', targetId);
      operations.splice(createOpIndex, 1);

      // Remove from local state
      if (collection === 'labels') {
        labels = labels.filter(l => l.idetiqueta !== targetId);
      } else {
        const parentId = opWithId.payload.IDETIQUETA;
        labels = labels.map(label => {
          if (label.idetiqueta === parentId) {
             return {
               ...label,
               subRows: label.subRows.filter(v => v.idvalor !== targetId)
             };
          }
          return label;
        });
      }
      refreshStatuses();
      notifyListeners();
      return;
    }

    // B. Check for UPDATE (Delete supersedes Update)
    const updateOpIndex = operations.findIndex(op =>
      op.action === 'UPDATE' &&
      op.collection === collection &&
      op.payload.id === targetId
    );

    if (updateOpIndex !== -1) {
      console.log('Eliminando operación UPDATE previa por DELETE para:', targetId);
      operations.splice(updateOpIndex, 1);
    }

    // C. Cascade Delete for Labels: Remove all pending operations for its values
    if (collection === 'labels') {
        const labelId = targetId;
        const initialLength = operations.length;
        operations = operations.filter(op => {
            if (op.collection === 'values' && op.payload.IDETIQUETA === labelId) {
                console.log('Cascade Delete: Eliminando operación de valor pendiente:', op);
                return false;
            }
            return true;
        });
        if (operations.length < initialLength) {
            console.log(`Se eliminaron ${initialLength - operations.length} operaciones de valores por eliminación de etiqueta.`);
        }
    }
  }

  // 2. Handle UPDATE logic (Merge or Add)
  if (opWithId.action === 'UPDATE') {
    // A. Check for DELETE (Update supersedes Delete - Restore?)
    const deleteOpIndex = operations.findIndex(op =>
      op.action === 'DELETE' &&
      op.collection === collection &&
      op.payload.id === targetId
    );

    if (deleteOpIndex !== -1) {
       // If item is deleted, we generally shouldn't allow updates unless it's a "Restore" action.
       // But if the user forces an update, we might want to remove the DELETE and apply the UPDATE (effectively restoring + updating).
       console.log('Eliminando operación DELETE previa por UPDATE (Restaurar) para:', targetId);
       operations.splice(deleteOpIndex, 1);
       // Note: If we remove DELETE, we need to ensure the item is "restored" in local state if it was hidden?
       // But our DELETE logic in updateLocalState just marks it as 'Negative', so it's still there.
       // So removing the DELETE op and adding UPDATE op should work fine, status will become Critical.
    }

    const existingUpdateOp = operations.find(op =>
      op.action === 'UPDATE' &&
      op.collection === collection &&
      op.payload.id === targetId
    );

    if (existingUpdateOp) {
      console.log('Combinando operación UPDATE para el item:', targetId);
      existingUpdateOp.payload.updates = {
          ...existingUpdateOp.payload.updates,
          ...opWithId.payload.updates
      };
      merged = true;
    } else {
      const existingCreateOp = operations.find(op =>
        op.action === 'CREATE' &&
        op.collection === collection &&
        (collection === 'labels' ? op.payload.IDETIQUETA : op.payload.IDVALOR) === targetId
      );

      if (existingCreateOp) {
        console.log('Combinando UPDATE en operación CREATE para el item:', targetId);
        existingCreateOp.payload = { ...existingCreateOp.payload, ...opWithId.payload.updates };
        merged = true;
      }
    }
  }

  // 3. If not merged, capture original values and add to queue
  if (!merged) {
      if (opWithId.action === 'UPDATE' || opWithId.action === 'DELETE') {
          let original: any = null;

          if (collection === 'labels') {
              original = labels.find(l => l.idetiqueta === targetId);
          } else {
              const parentId = opWithId.payload.IDETIQUETA;
              const parent = labels.find(l => l.idetiqueta === parentId);
              if (parent) {
                  original = parent.subRows.find(v => v.idvalor === targetId);
              }
          }
          if (original) {
            opWithId.originalValues = JSON.parse(JSON.stringify(original));
          }
      }
      operations.push(opWithId);
  }

  // 4. Update Local State
  updateLocalState(opWithId);
  refreshStatuses();
  notifyListeners();
};

export const removeOperation = (opId: string) => {
  const opIndex = operations.findIndex(o => o.id === opId);
  if (opIndex === -1) return;

  const op = operations[opIndex];
  operations.splice(opIndex, 1);
  console.log('Deshaciendo operación:', op);

  // Revert Local State
  if (op.action === 'CREATE') {
      const collection = op.collection;
      const targetId = collection === 'labels' ? op.payload.IDETIQUETA : op.payload.IDVALOR;

      if (collection === 'labels') {
          labels = labels.filter(l => l.idetiqueta !== targetId);
      } else {
           const parentId = op.payload.IDETIQUETA;
           labels = labels.map(l => {
               if (l.idetiqueta === parentId) {
                   return { ...l, subRows: l.subRows.filter(v => v.idvalor !== targetId) };
               }
               return l;
           });
      }
  } else if ((op.action === 'UPDATE' || op.action === 'DELETE') && op.originalValues) {
      const original = { ...op.originalValues, status: 'None' }; // Force status to None
      const collection = op.collection;

      if (collection === 'labels') {
          labels = labels.map(l => l.idetiqueta === original.idetiqueta ? original : l);
      } else {
          const parentId = op.payload.IDETIQUETA;
          labels = labels.map(l => {
              if (l.idetiqueta === parentId) {
                  const newSubRows = l.subRows.map(v => v.idvalor === original.idvalor ? original : v);
                  return { ...l, subRows: newSubRows };
              }
              return l;
          });
      }
  }

  notifyListeners();
  refreshStatuses();
};

export const getOperations = () => operations;

export const clearOperations = () => {
  operations = [];
};

export const clearStatuses = () => {
  labels = labels.map(label => {
    const newLabel = { ...label, status: 'None' };
    newLabel.subRows = newLabel.subRows.map(subRow => {
      const newSubRow = { ...subRow, status: 'None' };
      return newSubRow;
    });
    return newLabel;
  });
  notifyListeners();
};

export const clearLabelsCache = () => {
  labels = [];
  notifyListeners();
};

interface CellCoordinates {
  rowId: string;
  columnId: string;
}

let activeEditCell: CellCoordinates | null = null;

export const getActiveEditCell = () => activeEditCell;

export const setActiveEditCell = (coords: CellCoordinates | null) => {
  activeEditCell = coords;
  notifyListeners();
};
