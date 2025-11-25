// src/catalogos/etiquetasValores/components/ModalSaveChanges.tsx
import { Button, MessageBox, MessageBoxAction, MessageBoxType } from "@ui5/webcomponents-react";
import { useState } from "react";
import { getLabels, getOperations } from "../store/labelStore";

interface ModalSaveChangesProps {
  onSave: () => void;
  compact?: boolean;
}

function ModalSaveChanges({ onSave, compact = false }: ModalSaveChangesProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("¿Seguro que quieres guardar los cambios?");

  const handleSaveClick = () => {
    const operations = getOperations();
    const currentLabels = getLabels();

    const labelsToDelete = operations.filter(op =>
      op.collection === "labels" && op.action === "DELETE"
    );

    let hasDangerousDeletions = false;

    for (const op of labelsToDelete) {
      const label = currentLabels.find(l => l.idetiqueta === op.payload.id);

      if (label && label.subRows && label.subRows.length > 0) {
        hasDangerousDeletions = true;
        break;
      }
    }

    if (hasDangerousDeletions) {
      setConfirmationMessage(
        "Usted está por borrar un catálogo con valores adjuntos. Si continúa, se perderán todos los valores asignados. ¿Desea continuar?"
      );
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
      >
        {!compact && "Guardar cambios"}
      </Button>

      <MessageBox
        open={showConfirmDialog}
        type={MessageBoxType.Confirm}
        onClose={(event: any) => {
          if (event === MessageBoxAction.OK) {
            // 🔥 ahora el modal SOLO llama al padre
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