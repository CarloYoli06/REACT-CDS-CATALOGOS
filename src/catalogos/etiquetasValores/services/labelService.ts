// src/catalogos/etiquetasValores/services/labelService.ts
import {  setLabels, getOperations, clearOperations, clearStatuses } from '../store/labelStore';
import { getDbServer } from '../../../share/services/settingsService';

// Interfaces para la respuesta de la API
export interface ApiDetailRowReg {
    CURRENT: boolean;
    REGDATE: string;
    REGTIME: string;
    REGUSER: string;
}

export interface ApiDetailRow {
    ACTIVED: boolean;
    DELETED: boolean;
    DETAIL_ROW_REG: ApiDetailRowReg[];
}

export interface ApiValor {
    _id: string;
    IDSOCIEDAD: number;
    IDCEDI: number;
    IDETIQUETA: string;
    IDVALOR: string;
    IDVALORPA: string | null;
    VALOR: string;
    ALIAS: string;
    SECUENCIA: number;
    DESCRIPCION: string;
    IMAGEN: string | null;
    ROUTE: string | null;
    DETAIL_ROW: ApiDetailRow;
    createdAt: string;
    updatedAt: string;
}

export interface ApiLabel {
    _id: string;
    IDSOCIEDAD: number;
    IDCEDI: number;
    IDETIQUETA: string;
    ETIQUETA: string;
    INDICE: string;
    COLECCION: string;
    SECCION: string;
    SECUENCIA: number;
    IMAGEN: string;
    ROUTE: string;
    DETAIL_ROW: ApiDetailRow;
    createdAt: string;
    updatedAt: string;
    DESCRIPCION: string;
    valores: ApiValor[];
}

// Interfaces para el formato de la tabla
export interface TableSubRow {
    idsociedad: string;
    idcedi: string;
    idetiqueta: string;
    idvalor: string;
    idvalorpa: string | null;
    valor: string;
    alias: string;
    secuencia: number;
    imagen: string | null;
    ruta: string | null;
    descripcion: string;
    status?: string;
    isSelected?: boolean
    indice: string;
    coleccion: string;
    seccion: string;
}

export interface TableParentRow {
    parent: true;
    idsociedad: string;
    idcedi: string;
    idetiqueta: string;
    etiqueta: string;
    indice: string;
    coleccion: string;
    seccion: string;
    secuencia: number;
    imagen: string;
    ruta: string;
    descripcion: string;
    status?: string;
    isSelected?: boolean
    isExpanded?: boolean
    subRows: TableSubRow[];
}

const transformData = (labels: ApiLabel[]): TableParentRow[] => {
    return labels.map((label) => {
        const subRows: TableSubRow[] = (label.valores || []).map((valor) => ({
            idsociedad: valor.IDSOCIEDAD?.toString() || '',
            idcedi: valor.IDCEDI?.toString() || '',
            idetiqueta: valor.IDETIQUETA || '',
            idvalor: valor.IDVALOR || '',
            idvalorpa: valor.IDVALORPA || null,
            valor: valor.VALOR || '',
            alias: valor.ALIAS || '',
            secuencia: valor.SECUENCIA || 0,
            imagen: valor.IMAGEN || null,
            ruta: valor.ROUTE || null,
            descripcion: valor.DESCRIPCION || '',
            indice: label.INDICE || '',
            coleccion: label.COLECCION || '',
            seccion: label.SECCION || '',
        }));
        return {
            parent: true,
            idsociedad: label.IDSOCIEDAD?.toString() || '',
            idcedi: label.IDCEDI?.toString() || '',
            idetiqueta: label.IDETIQUETA,
            etiqueta: label.ETIQUETA,
            indice: label.INDICE || '',
            coleccion: label.COLECCION || '',
            seccion: label.SECCION || '',
            secuencia: label.SECUENCIA,
            imagen: label.IMAGEN,
            ruta: label.ROUTE,
            descripcion: label.DESCRIPCION,
            subRows: subRows,
        };
    });
};

export const fetchLabels = async (): Promise<TableParentRow[]> => {
    // const storedLabels = getLabels();
    // if (storedLabels.length > 0) {
    //     return storedLabels;
    // }
    try {
        const dbServer = getDbServer();
        const apiUrl = `http://localhost:3034/api/cat/crudLabelsValues?ProcessType=GetAll&LoggedUser=MIGUELLOPEZ&DBServer=${dbServer}`;

        console.log(`Fetching labels from: ${apiUrl}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log("Response:", response)
        const result = await response.json();
        console.log("result:", result.data[0]);
        const apiData: ApiLabel[] = result.data[0].dataRes || [];
        const transformedData = transformData(apiData);
        setLabels(transformedData);
        console.log("apiData:", apiData)
        return transformedData;
    } catch (error) {
        console.error("Error fetching labels:", error);
        return [];
    }
};

export const saveChanges = async (): Promise<{ success: boolean; message?: string; errors?: any[] }> => {
    const operations = getOperations();
    if (operations.length === 0) {
        return { success: true, message: 'No hay cambios que guardar.' };
    }

    // Sanitizar operaciones: eliminar campos internos
    const sanitizedOperations = operations.map(op => {
        const newOp = { ...op };
        delete newOp.id;
        delete newOp.originalValues;
        return newOp;
    });

    try {
        console.log("operations (sanitized):", JSON.stringify(sanitizedOperations, null, 2))
        const dbServer = getDbServer();
        const apiUrl = `http://localhost:3034/api/cat/crudLabelsValues?ProcessType=CRUD&LoggedUser=MIGUELLOPEZ&DBServer=${dbServer}`;

        console.log(`Saving changes to: ${apiUrl}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ operations: sanitizedOperations }),
        });

        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error('Respuesta no JSON:', textResponse);
            return {
                success: false,
                errors: [{
                    status: 'ERROR',
                    operation: 'BATCH',
                    collection: 'multiple',
                    id: 'batch',
                    error: {
                        code: 'INVALID_RESPONSE',
                        message: `El servidor devolvió: ${textResponse.substring(0, 100)}`
                    }
                }]
            };
        }

        const result = await response.json();
        console.log('Respuesta completa del backend:', result);

        // 🔥 NUEVO: Manejar el formato de error de SAP CAP/OData
        // El backend puede devolver errores en formato: { error: { message, innererror, code } }
        if (result.error) {
            console.log('Formato de error SAP CAP detectado');
            
            let backendErrors = [];
            
            // Intentar extraer errores del innererror
            if (result.error.innererror) {
                const innerError = result.error.innererror;
                
                // Caso 1: Los errores están en innererror.data[0].dataRes
                if (innerError.data && Array.isArray(innerError.data) && innerError.data[0]?.dataRes) {
                    backendErrors = innerError.data[0].dataRes;
                }
                // Caso 2: Los errores están directamente en innererror.dataRes
                else if (innerError.dataRes && Array.isArray(innerError.dataRes)) {
                    backendErrors = innerError.dataRes;
                }
                // Caso 3: El mensaje está en innererror
                else {
                    backendErrors = [{
                        status: 'ERROR',
                        operation: 'BATCH',
                        collection: 'multiple',
                        id: 'batch',
                        error: {
                            code: result.error.code || 'OPERATION_FAILED',
                            message: innerError.messageUSR || innerError.messageDEV || result.error.message || 'Error al guardar cambios'
                        }
                    }];
                }
            } else {
                // Si no hay innererror, crear error genérico del mensaje principal
                backendErrors = [{
                    status: 'ERROR',
                    operation: 'BATCH',
                    collection: 'multiple',
                    id: 'batch',
                    error: {
                        code: result.error.code || 'OPERATION_FAILED',
                        message: result.error.message || 'Error al guardar cambios'
                    }
                }];
            }

            console.log('Errores extraídos (formato SAP CAP):', backendErrors);

            return {
                success: false,
                errors: backendErrors
            };
        }
        
        // Verificar si el backend indica error en formato estándar
        if (!result.success) {
            // Extraer los errores del lugar correcto
            let backendErrors = [];
            
            // Caso 1: Errores en result.data[0].dataRes (estructura de bitácora)
            if (result.data && Array.isArray(result.data) && result.data[0]?.dataRes) {
                backendErrors = result.data[0].dataRes;
            }
            // Caso 2: Errores directamente en result.dataRes
            else if (result.dataRes && Array.isArray(result.dataRes)) {
                backendErrors = result.dataRes;
            }
            // Caso 3: Si no hay estructura de errores, crear una genérica
            else {
                backendErrors = [{
                    status: 'ERROR',
                    operation: 'BATCH',
                    collection: 'multiple',
                    id: 'batch',
                    error: {
                        code: 'OPERATION_FAILED',
                        message: result.messageUSR || result.messageDEV || 'Error al guardar cambios'
                    }
                }];
            }

            console.log('Errores extraídos (formato estándar):', backendErrors);

            return {
                success: false,
                errors: backendErrors
            };
        }

        // Todo salió bien
        clearOperations();
        clearStatuses();
        
        console.log("Cambios guardados exitosamente.");
        return { success: true, message: 'Cambios guardados exitosamente.' };
        
    } catch (error: any) {
        console.error("Error saving changes:", error);
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