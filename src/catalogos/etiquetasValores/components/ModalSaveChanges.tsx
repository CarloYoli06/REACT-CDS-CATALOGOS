import { Button, MessageBox, MessageBoxType, MessageBoxAction } from '@ui5/webcomponents-react';
import { Modals } from '@ui5/webcomponents-react/Modals';
import { saveChanges } from '../services/labelService';
import { useState } from 'react';
import { clearStatuses, getLabels, setLabels, clearOperations, getOperations } from '../store/labelStore';

interface ModalSaveChangesProps {
    onSave: () => void;
    compact?: boolean;
}

function ModalSaveChanges({ onSave, compact = false }: ModalSaveChangesProps) {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState("¿Seguro que quieres guardar los cambios?");

    const handleSaveChanges = async () => {
        const result = await saveChanges();
        if (result.success) {
            const currentLabels = getLabels();

            // FIC: Filter out deleted parents AND deleted children
            const activeLabels = currentLabels
                .filter(label => label.status !== 'Negative')
                .map(label => ({
                    ...label,
                    subRows: label.subRows.filter(sub => sub.status !== 'Negative')
                }));

            setLabels(activeLabels);

            clearStatuses(); // Clear statuses on successful save
            //clearLabelsCache(); // Limpia los datos en memoria
            clearOperations();  // Limpia las operaciones pendientes
            Modals.showMessageBox({
                type: MessageBoxType.Success,
                children: 'Cambios guardados con éxito.'
            });
            if (onSave) {
                onSave();
            }
        } else {
            Modals.showMessageBox({
                type: MessageBoxType.Error,
                children: `Error al guardar los cambios: ${result.message}`
            });
        }
    };

    const handleSaveClick = () => {
        const operations = getOperations();
        const labelsToDelete = operations.filter(op => op.collection === 'labels' && op.action === 'DELETE');

        let hasDangerousDeletions = false;
        const currentLabels = getLabels();

        for (const op of labelsToDelete) {
            const labelId = op.payload.id;
            const label = currentLabels.find(l => l.idetiqueta === labelId);
            // Check if the label has subRows (values)
            // Even if values are also marked for deletion, the warning is about the catalog having values.
            if (label && label.subRows && label.subRows.length > 0) {
                hasDangerousDeletions = true;
                break;
            }
        }

        if (hasDangerousDeletions) {
            setConfirmationMessage("Usted está por borrar un catálogo con valores adjuntos, de borrarse se perderán todos los valores asignados a este catálogo ¿Continuar?");
        } else {
            setConfirmationMessage("¿Seguro que quieres guardar los cambios?");
        }
        setShowConfirmDialog(true);
    };

    return (
        <>
            <Button
                design="Emphasized"
                icon="save"
                onClick={handleSaveClick}
                accessibleName="Guardar cambios"
            >
                {!compact && 'Guardar cambios'}
            </Button>
            <MessageBox
                open={showConfirmDialog}
                type={MessageBoxType.Confirm}

                onClose={(event: any) => {
                    if (event === MessageBoxAction.OK) {
                        console.log("Saving changes...")
                        handleSaveChanges();
                    }
                    setShowConfirmDialog(false);
                }}
            >
                {confirmationMessage}
            </MessageBox>
        </>
    );
}

export default ModalSaveChanges;