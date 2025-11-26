import { useState, useEffect } from 'react';
import { Button, MessageBox } from '@ui5/webcomponents-react';
import { TableSubRow, TableParentRow } from '../services/labelService';

interface ModalDeleteProps {
    compact?: boolean;
    selectedLabels: TableParentRow[];
    selectedValores: TableSubRow[];
    selectedValorParent: TableParentRow | null;
    onDeleteConfirmCatalogo: () => void;
    onDeleteConfirmValor: () => void;
}

type DeleteMode = 'catalogo' | 'valor' | null;

function ModalDelete({
    compact = false,
    selectedLabels,
    selectedValores,
    selectedValorParent,
    onDeleteConfirmCatalogo,
    onDeleteConfirmValor
}: ModalDeleteProps) {
    const [open, setOpen] = useState(false);
    const [deleteMode, setDeleteMode] = useState<DeleteMode>(null);
    const [isDisabled, setIsDisabled] = useState(true);
    const [buttonText, setButtonText] = useState('Eliminar');

    // Determinar el estado del botón
    useEffect(() => {
        const hasCatalogos = selectedLabels.length > 0;
        const hasValores = selectedValores.length > 0 && selectedValorParent !== null;

        if (hasCatalogos && !hasValores) {
            setIsDisabled(false);
            setButtonText(selectedLabels.length === 1 ? 'Eliminar Catálogo' : 'Eliminar Catálogos');
        } else if (hasValores && !hasCatalogos) {
            setIsDisabled(false);
            setButtonText(selectedValores.length === 1 ? 'Eliminar Valor' : 'Eliminar Valores');
        } else {
            setIsDisabled(true);
            setButtonText('Eliminar');
        }
    }, [selectedLabels, selectedValores, selectedValorParent]);

    const handleOpen = () => {
        const hasCatalogos = selectedLabels.length > 0;
        const hasValores = selectedValores.length > 0 && selectedValorParent !== null;

        if (hasCatalogos && !hasValores) {
            setDeleteMode('catalogo');
        } else if (hasValores && !hasCatalogos) {
            setDeleteMode('valor');
        } else {
            return;
        }

        setOpen(true);
    };

    const handleClose = (event: any) => {
        const action = event?.detail?.action || event?.detail || event;

        console.log("DEBUG - Acción recibida del Modal:", action);

        if (action === "OK" || action === "Confirm") {
            if (deleteMode === 'catalogo') {
                console.log("DEBUG - Borrando catálogo(s):", selectedLabels.map(l => l.etiqueta));
                onDeleteConfirmCatalogo();
            } else if (deleteMode === 'valor') {
                console.log("DEBUG - Borrando valor(es):", selectedValores.map(v => v.valor));
                onDeleteConfirmValor();
            }
        }

        setOpen(false);
        setDeleteMode(null);
    };

    // Generar el mensaje del modal según el modo y cantidad de elementos
    const getModalMessage = () => {
        if (deleteMode === 'catalogo') {
            if (selectedLabels.length === 1) {
                const label = selectedLabels[0];
                return (label.subRows && label.subRows.length > 0)
                    ? `¿Está seguro de borrar el catálogo "${label.etiqueta}"? Tiene ${label.subRows.length} valor(es) asignado(s)`
                    : `¿Seguro que quieres eliminar el Catálogo: "${label.etiqueta}"?`;
            } else {
                const totalWithValues = selectedLabels.filter(l => l.subRows && l.subRows.length > 0).length;
                return totalWithValues > 0
                    ? `¿Está seguro de borrar ${selectedLabels.length} catálogos? ${totalWithValues} de ellos tienen valores asignados`
                    : `¿Seguro que quieres eliminar ${selectedLabels.length} catálogos?`;
            }
        } else if (deleteMode === 'valor' && selectedValorParent) {
            if (selectedValores.length === 1) {
                return `¿Seguro que quieres eliminar el Valor: "${selectedValores[0].valor}" del Catálogo "${selectedValorParent.etiqueta}"?`;
            } else {
                return `¿Seguro que quieres eliminar ${selectedValores.length} valores del Catálogo "${selectedValorParent.etiqueta}"?`;
            }
        }
        return '';
    };

    const getModalTitle = () => {
        if (deleteMode === 'catalogo') {
            return selectedLabels.length === 1 ? 'Confirmar Eliminación' : 'Confirmar Eliminación de Catálogos';
        } else if (deleteMode === 'valor') {
            return selectedValores.length === 1 ? 'Confirmar Eliminación de Valor' : 'Confirmar Eliminación de Valores';
        }
        return 'Confirmar Eliminación';
    };

    return (
        <>
            <Button
                design="Negative"
                icon="delete"
                accessibleName="Eliminar"
                onClick={handleOpen}
                disabled={isDisabled}
            >
                {!compact && buttonText}
            </Button>

            <MessageBox
                open={open}
                onClose={handleClose}
                type={"Confirm" as any}
                titleText={getModalTitle()}
            >
                {getModalMessage()}
            </MessageBox>
        </>
    );
}

export default ModalDelete;