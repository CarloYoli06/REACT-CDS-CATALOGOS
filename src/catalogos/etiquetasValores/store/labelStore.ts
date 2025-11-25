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

export const addOperation = (operation: Operation) => {
  const opId = operation.id || generateId();
  const opWithId: Operation = { ...operation, id: opId };
  let merged = false;

  const targetId = opWithId.payload.id || (opWithId.collection === 'labels' ? opWithId.payload.IDETIQUETA : opWithId.payload.IDVALOR);
  const collection = opWithId.collection;

  // 1. Handle DELETE
  if (opWithId.action === 'DELETE') {
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
       console.log('Eliminando operación DELETE previa por UPDATE para:', targetId);
       operations.splice(deleteOpIndex, 1);
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
      const original = op.originalValues;
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
};

export const getOperations = () => operations;

export const clearOperations = () => {
  operations = [];
};

export const executeOperations = async (): Promise<{ success: boolean; errors?: any[] }> => {
  if (operations.length === 0) {
    return { success: true };
  }

  try {
    // Ajusta la URL a tu endpoint real
    const response = await fetch('/api/catalogos/execute-operations', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Agrega aquí tus headers de autenticación si los necesitas
      },
      body: JSON.stringify({ operations })
    });

    const data = await response.json();

    if (!response.ok || data.status === 'ERROR') {
      return {
        success: false,
        errors: data.dataRes || data.errors || [{
          status: 'ERROR',
          operation: 'BATCH',
          collection: 'multiple',
          id: 'batch',
          error: {
            code: 'OPERATION_FAILED',
            message: data.messageUSR || 'Error al guardar cambios'
          }
        }]
      };
    }

    // Si todo salió bien, limpiar
    clearOperations();
    clearStatuses();
    
    return { success: true };

  } catch (error: any) {
    return {
      success: false,
      errors: [{
        status: 'ERROR',
        operation: 'BATCH',
        collection: 'multiple',
        id: 'batch',
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Error de conexión al guardar'
        }
      }]
    };
  }
};

export const clearStatuses = () => {
  labels = labels.map(label => {
    const newLabel = { ...label };
    delete newLabel.status;
    newLabel.subRows = newLabel.subRows.map(subRow => {
      const newSubRow = { ...subRow };
      delete newSubRow.status;
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
