import React, { useState, useMemo, useEffect, FC } from 'react';
import {
    ComboBox,
    ComboBoxItem,
    ComboBoxItemGroup,
    Dialog,
    List,
    ListItemStandard,
    ListItemGroup,
    Button,
    Bar,
    Title,
    Search
} from '@ui5/webcomponents-react';
import type { SearchDomRef, ListDomRef, ComboBoxDomRef } from '@ui5/webcomponents-react';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import type { ListSelectionChangeEventDetail } from '@ui5/webcomponents/dist/List.js';
import type { ComboBoxSelectionChangeEventDetail } from '@ui5/webcomponents/dist/ComboBox.js';

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
    indice: string;
    coleccion: string;
    seccion: string;
}

export interface LabelData {
    parent?: boolean;
    idsociedad: string;
    idcedi: string;
    idetiqueta: string;
    etiqueta: string;
    indice: string;
    coleccion: string;
    seccion: string;
    secuencia: number;
    imagen: string | null;
    ruta: string | null;
    descripcion: string;
    subRows: TableSubRow[];
}

export interface ValueHelpSelectorProps {
    data: LabelData[];
    value: string | null;
    onSelect: (selectedValue: string | null) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
}

function findValueById(data: LabelData[], id: string | null): TableSubRow | null {
    if (!id || !data) return null;
    for (const label of data) {
        const foundValue = (label.subRows || []).find(v => v.idvalor === id);
        if (foundValue) {
            return foundValue;
        }
    }
    return null;
}

export const ValueHelpSelector: FC<ValueHelpSelectorProps> = ({
    data,
    value,
    onSelect,
    placeholder
}) => {
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [displayedValue, setDisplayedValue] = useState<string>('');

    useEffect(() => {
        if (value) {
            const selectedItem = findValueById(data, value);
            setDisplayedValue(selectedItem ? selectedItem.valor : '');
        } else {
            setDisplayedValue('');
        }
    }, [value, data]);

    // Filtrado para la búsqueda interna (cuando el dialog está abierto)
    const internalFilteredData = useMemo(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        if (!lowerSearchTerm) return data;

        return data
            .map(label => ({
                ...label,
                subRows: (label.subRows || []).filter(valor =>
                    Object.values(valor).some(val => 
                        String(val).toLowerCase().includes(lowerSearchTerm)
                    )
                ),
            }))
            .filter(label => label.subRows.length > 0);
    }, [data, searchTerm]);

    // Renderizar items del ComboBox agrupados
    const renderComboBoxItems = useMemo(() => {
        const items: JSX.Element[] = [];

        data.forEach((label) => {
            if (label.subRows && label.subRows.length > 0) {
                // Agregar header del grupo
                items.push(
                    <ComboBoxItemGroup key={`group-${label.idetiqueta}`} headerText={label.etiqueta} />
                );

                // Agregar valores del grupo
                label.subRows.forEach((valor) => {
                    items.push(
                        <ComboBoxItem
                            key={`${label.idetiqueta}-${valor.idvalor}`}
                            text={`${valor.valor} (${valor.idvalor})`}
                            data-idvalor={valor.idvalor}
                        />
                    );
                });
            }
        });

        return items;
    }, [data]);

    const handleOpenDialog = () => {
        setSearchTerm('');
        setDialogOpen(true);
    };

    const handleCloseDialog = () => setDialogOpen(false);

    const handleInternalSearchChange = (event: Ui5CustomEvent<SearchDomRef>) => {
        setSearchTerm(event.target.value ?? '');
    };

    const handleComboBoxChange = (event: Ui5CustomEvent<ComboBoxDomRef, ComboBoxSelectionChangeEventDetail>) => {
        const selectedItem = event.detail.item;

        if (selectedItem) {
            const idvalor = selectedItem.dataset.idvalor;
            if (idvalor) {
                onSelect(idvalor);
            }
        }
    };

    const handleValueSelect = (event: Ui5CustomEvent<ListDomRef, ListSelectionChangeEventDetail>) => {
        const selectedItem = event.detail.selectedItems[0] as HTMLElement;
        const id = selectedItem.dataset.idvalor;

        if (id) {
            onSelect(id);
            handleCloseDialog();
        }
    };

    const handleClearSelect = () => {
        onSelect(null);
        handleCloseDialog();
    };

    const handleClearExternal = () => {
        onSelect(null);
    };

    return (
        <div style={{ width: '100%', position: 'relative' }}>


            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch', width: '100%' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <ComboBox
                        value={displayedValue}
                        placeholder={placeholder || 'Buscar o seleccionar...'}
                        onSelectionChange={handleComboBoxChange}
                        style={{ width: '100%' }}
                    >
                        {renderComboBoxItems}
                    </ComboBox>
                </div>

                {/* Botón para abrir modal */}
                <Button
                    design="Transparent"
                    icon="value-help"
                    onClick={handleOpenDialog}
                    tooltip="Abrir ayuda de valor"
                    style={{ height: 'auto' }}
                />

                {/* Botón Limpiar externo */}
                {value && (
                    <Button
                        design="Transparent"
                        icon="decline"
                        onClick={handleClearExternal}
                        tooltip="Limpiar selección"
                        style={{ height: 'auto' }}
                    />
                )}
            </div>

            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                style={{ width: '600px', maxWidth: '90vw' }}
                header={
                    <Bar
                        startContent={<Title>Seleccionar Valor</Title>}
                        endContent={
                            <Search
                                placeholder="Buscar valor..."
                                onInput={handleInternalSearchChange}
                            />
                        }
                    />
                }
                footer={
                    <Bar
                        startContent={
                            <Button
                                design="Transparent"
                                onClick={handleClearSelect}
                            >
                                Ninguno
                            </Button>
                        }
                        endContent={
                            <Button onClick={handleCloseDialog}>Cerrar</Button>
                        }
                    />
                }
            >
                <List
                    selectionMode="Single"
                    onSelectionChange={handleValueSelect}
                >
                    {internalFilteredData.length === 0 && (
                        <ListItemStandard>No se encontraron resultados.</ListItemStandard>
                    )}
                    {internalFilteredData.map(label => (
                        <React.Fragment key={label.idetiqueta}>
                            {/* Header de grupo más compacto y sutil */}
                            <ListItemGroup
                                
                                headerText={label.etiqueta}
                                
                            />
                            {label.subRows.map((valor, index) => (
                                <React.Fragment key={`${label.idetiqueta}-${valor.idvalor}`}>
                                    <ListItemStandard
                                        data-idvalor={valor.idvalor}
                                        selected={value === valor.idvalor}
                                        style={{
                                            padding: '0.85rem 1.25rem',
                                            borderBottom: index < label.subRows.length - 1 ? '1px solid #f5f5f5' : 'none',
                                            fontSize: '0.95rem'
                                        }}
                                        text={`${valor.valor} (${valor.idvalor})`}
                                        
                                    />
                                </React.Fragment>
                            ))}
                        </React.Fragment>
                    ))}
                </List>
            </Dialog>
        </div>
    );
};

export default ValueHelpSelector;