import { useState } from 'react';
import { Button, MessageBox } from '@ui5/webcomponents-react';
import { TableParentRow } from '../services/labelService';

interface ModalDeleteCatalogoProps {
    compact?: boolean;
    label: TableParentRow | null;
    onDeleteConfirm: (label: TableParentRow) => void;
}

function ModalDeleteCatalogo({ compact = false, label, onDeleteConfirm }: ModalDeleteCatalogoProps) {
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = (event: any) => {
        // --- ZONA DE SEGURIDAD ---
        // 1. Detectamos la acción de forma segura (sin crashear)
        // A veces viene en event.detail.action, a veces el evento mismo es la acción.
        const action = event?.detail?.action || event?.detail || event;

        console.log("DEBUG - Acción recibida del Modal:", action);

        // 2. Verificamos si es "OK" (El botón de confirmar)
        if (action === "OK" || action === "Confirm") { // Agregamos "Confirm" por si acaso
            if (label) {
                console.log("DEBUG - Borrando etiqueta:", label.etiqueta);
                onDeleteConfirm(label);
            }
        }

        // 3. Cerramos el modal SIEMPRE, pase lo que pase
        setOpen(false);
    };

    const isDisabled = !label;

    return (
        <>
            <Button
                design="Negative"
                icon="delete"
                accessibleName="Eliminar Catalogo"
                onClick={handleOpen}
                disabled={isDisabled}
            >
                {!compact && 'Eliminar Catalogo'}
            </Button>

            <MessageBox
                open={open}
                onClose={handleClose}
                // Usamos el string directo para evitar líos de tipos
                type={"Confirm" as any}
                titleText="Confirmar Eliminación"
            >
                {label ? (
                    (label.subRows && label.subRows.length > 0)
                        ? `Está seguro de borrar el catálogo ${label.etiqueta}? Tiene valores asignados`
                        : `¿Seguro que quieres eliminar el Catálogo: ${label.etiqueta}?`
                ) : ''}
            </MessageBox>
        </>
    );
}

export default ModalDeleteCatalogo;