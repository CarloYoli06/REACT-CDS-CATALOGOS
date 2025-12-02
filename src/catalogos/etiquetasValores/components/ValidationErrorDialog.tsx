import { Dialog, Button, FlexBox, FlexBoxJustifyContent, MessageStrip } from '@ui5/webcomponents-react';

interface BackendError {
    status: 'ERROR';
    operation: string;
    collection: string;
    id: string;
    error: {
        code: string;
        message: string;
    };
}

interface ValidationErrorDialogProps {
    open: boolean;
    errors: any; // Puede ser errores del frontend (objeto) o del backend (array)
    onClose: () => void;
    title?: string;
}

function ValidationErrorDialog({ open, errors, onClose, title = "Errores de Validación" }: ValidationErrorDialogProps) {

    // Función para determinar si los errores vienen del backend
    const isBackendError = (errors: any): errors is BackendError[] => {
        return Array.isArray(errors) && errors.length > 0 && errors[0].hasOwnProperty('status');
    };

    // Función para renderizar errores del frontend
    const renderFrontendErrors = (errors: any) => {
        const errorEntries = Object.entries(errors);
        if (errorEntries.length === 0) return null;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {errorEntries.map(([field, message]) => (
                    <MessageStrip
                        key={field}
                        design="Negative"
                        hideCloseButton
                    >
                        <strong>{field}:</strong> {message as string}
                    </MessageStrip>
                ))}
            </div>
        );
    };

    // Función para obtener el icono según el código de error
    const getErrorIcon = (code: string) => {
        switch (code) {
            case 'DUPLICATE_KEY':
            case 'DUPLICATE_ID':
                return '⚠️';
            case 'PARENT_NOT_FOUND':
            case 'PARENT_LABEL_NOT_FOUND':
            case 'NOT_FOUND':
                return '🔍';
            case 'INVALID_OPERATION':
                return '🚫';
            case 'INVALID_ACTION':
            case 'INVALID_COLLECTION':
                return '❌';
            default:
                return '⚠️';
        }
    };

    // Función para renderizar errores del backend
    const renderBackendErrors = (errors: BackendError[]) => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {errors.map((error, index) => (
                    <MessageStrip
                        key={index}
                        design="Negative"
                        hideCloseButton
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                {getErrorIcon(error.error?.code)} Operación: {error.operation} en {error.collection}
                            </div>
                            <div>
                                <strong>ID:</strong> {error.id}
                            </div>
                            <div>
                                <strong>Error:</strong> {error.error?.message}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                                Código: {error.error?.code}
                            </div>
                        </div>
                    </MessageStrip>
                ))}
            </div>
        );
    };

    // Determinar qué tipo de errores mostrar
    const hasErrors = isBackendError(errors)
        ? errors.length > 0
        : Object.keys(errors).length > 0;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            headerText={title}
            footer={
                <FlexBox justifyContent={FlexBoxJustifyContent.End} fitContainer style={{ paddingBlock: '0.25rem' }}>
                    <Button onClick={onClose}>Cerrar</Button>
                </FlexBox>
            }
        >
            <div style={{ padding: '1rem', minWidth: '400px' }}>
                {!hasErrors ? (
                    <MessageStrip design="Information" hideCloseButton>
                        No hay errores para mostrar.
                    </MessageStrip>
                ) : isBackendError(errors) ? (
                    <>
                        <MessageStrip design="Critical" hideCloseButton style={{ marginBottom: '1rem' }}>
                            Se encontraron {errors.length} error(es) al procesar la operación.
                            Los cambios no fueron guardados.
                        </MessageStrip>
                        {renderBackendErrors(errors)}
                    </>
                ) : (
                    <>
                        <MessageStrip design="Critical" hideCloseButton style={{ marginBottom: '1rem' }}>
                            Por favor, corrija los siguientes errores antes de continuar:
                        </MessageStrip>
                        {renderFrontendErrors(errors)}
                    </>
                )}
            </div>
        </Dialog>
    );
}

export default ValidationErrorDialog;