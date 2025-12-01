// src/catalogos/etiquetasValores/components/ModalSaveChanges.tsx
import { Button, MessageBox, MessageBoxAction, MessageBoxType } from "@ui5/webcomponents-react";
import { useState } from "react";
import { getLabels, getOperations } from "../store/labelStore";

interface ModalSaveChangesProps {
  onSave: () => void;
  compact?: boolean;
  busy?: boolean;
}

function ModalSaveChanges({ onSave, compact = false, busy = false }: ModalSaveChangesProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("¿Seguro que quieres guardar los cambios?");

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
        disabled={busy}
      >
        {!compact && (busy ? 'Guardando...' : 'Guardar cambios')}
      </Button>
      <MessageBox
        open={showConfirmDialog}
        type={MessageBoxType.Confirm}
        onClose={(event: any) => {
          if (event === MessageBoxAction.OK) {
            onSave();
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