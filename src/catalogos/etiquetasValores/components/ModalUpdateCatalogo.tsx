// src/catalogos/etiquetasValores/components/ModalUpdateCatalogo.tsx

import { Button, FlexBox, FlexBoxJustifyContent, Form, FormGroup, FormItem, Input, Label, Dialog, MultiInput, Token, ComboBox, ComboBoxItem } from '@ui5/webcomponents-react';
import { useState, useEffect, useRef } from 'react';
import { addOperation, getLabels } from '../store/labelStore';
import { TableParentRow, TableSubRow } from '../services/labelService';
import ValidationErrorDialog from './ValidationErrorDialog';

interface ModalUpdateCatalogoProps {
    label: TableParentRow | null;
}

function ModalUpdateCatalogo({ label }: ModalUpdateCatalogoProps) {
    const initialFormState: TableParentRow = {
        parent: true,
        idetiqueta: '',
        idsociedad: '0',
        idcedi: '0',
        etiqueta: '',
        indice: '',
        coleccion: '',
        seccion: '',
        secuencia: 0,
        imagen: '',
        ruta: '',
        descripcion: '',
        subRows: [],
    };

    const [formData, setFormData] = useState<TableParentRow>(initialFormState);
    const latestFormRef = useRef<TableParentRow>(initialFormState);
    const [errors, setErrors] = useState<any>({});

    // --- Estados para el MultiInput ---
    const [inputValue, setInputValue] = useState('');
    const [indiceTokens, setIndiceTokens] = useState<string[]>([]);

    const [sociedadOptions, setSociedadOptions] = useState<TableSubRow[]>([]);
    const [cediOptions, setCediOptions] = useState<TableSubRow[]>([]);
    const [comboInputs, setComboInputs] = useState({ idsociedad: '', idcedi: '' });

    // --- Estado para la visibilidad del Modal ---
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [showErrorDialog, setShowErrorDialog] = useState(false);

    // Este useEffect se ejecuta cuando el 'label' seleccionado (la prop) cambia
    useEffect(() => {
        const labels = getLabels();
        const sociedadLabel = labels.find(l => l.etiqueta === 'SOCIEDAD');
        const cediLabel = labels.find(l => l.etiqueta === 'Catálogo de Centros de Distribución');

        const todosSociedad: TableSubRow = {
            idsociedad: '0', idcedi: '0', idetiqueta: 'SOCIEDAD', idvalor: '0', idvalorpa: null, valor: 'TODOS', alias: '', secuencia: 0, imagen: null, ruta: null, descripcion: '', indice: '', coleccion: '', seccion: ''
        };
        const todosCedi: TableSubRow = {
            idsociedad: '0', idcedi: '0', idetiqueta: 'Catálogo de Centros de Distribución', idvalor: '0', idvalorpa: '0', valor: 'TODOS', alias: '', secuencia: 0, imagen: null, ruta: null, descripcion: '', indice: '', coleccion: '', seccion: ''
        };

        const sOptions = sociedadLabel?.subRows ? [todosSociedad, ...sociedadLabel.subRows] : [todosSociedad];
        const cOptions = cediLabel?.subRows ? [todosCedi, ...cediLabel.subRows] : [todosCedi];

        setSociedadOptions(sOptions);
        setCediOptions(cOptions);

        if (label) {
            // Pre-carga el estado del formulario y los tokens
            setFormData(label);
            latestFormRef.current = label;

            const tokens = label.indice ? label.indice.split(',').filter(t => t.trim() !== '') : [];
            setIndiceTokens(tokens.map(t => t.trim()));
            setInputValue('');

            // Set initial combo inputs based on IDs
            const foundSociedad = sOptions.find(o => String(o.idvalor) === String(label.idsociedad));
            const initialSociedadText = foundSociedad ? foundSociedad.valor : String(label.idsociedad || '');

            const foundCedi = cOptions.find(o => String(o.idvalor) === String(label.idcedi));
            const initialCediText = foundCedi ? foundCedi.valor : String(label.idcedi || '');

            setComboInputs({
                idsociedad: initialSociedadText,
                idcedi: initialCediText
            });
        } else {
            // Resetea si no hay label seleccionado
            setFormData(initialFormState);
            latestFormRef.current = initialFormState;
            setIndiceTokens([]);
            setInputValue('');
            setComboInputs({ idsociedad: '', idcedi: '' });
        }
    }, [label]); // Depende solo de 'label'

    // --- (La función validate es idéntica) ---
    const validate = (data: Partial<TableParentRow>) => {
        const newErrors: any = {};
        if (!data.etiqueta) newErrors.etiqueta = 'ETIQUETA es requerido.';
        if (!data.indice) newErrors.indice = 'INDICE es requerido.';
        if (!data.coleccion) newErrors.coleccion = 'COLECCION es requerido.';
        if (!data.seccion) newErrors.seccion = 'SECCION es requerido.';
        if (!data.idetiqueta) newErrors.idetiqueta = 'ID ETIQUETA es requerido.';
        if (data.idsociedad === undefined || data.idsociedad === null || data.idsociedad === '') newErrors.idsociedad = 'ID SOCIEDAD es requerido.';
        if (data.idcedi === undefined || data.idcedi === null || data.idcedi === '') newErrors.idcedi = 'ID CEDI es requerido.';
        if (data.secuencia !== undefined && data.secuencia !== null && isNaN(Number(data.secuencia))) newErrors.secuencia = 'SECUENCIA debe ser un número.';
        if (data.idsociedad !== undefined && data.idsociedad !== null && data.idsociedad !== '' && isNaN(Number(data.idsociedad))) newErrors.idsociedad = 'ID SOCIEDAD debe ser un número.';
        if (data.idcedi !== undefined && data.idcedi !== null && data.idcedi !== '' && isNaN(Number(data.idcedi))) newErrors.idcedi = 'ID CEDI debe ser un número.';
        setErrors(newErrors);
        const isValid = Object.keys(newErrors).length === 0;
        if (!isValid) {
            console.error('Errores de validación:', JSON.stringify(newErrors));
        }
        return isValid;
    };


    // --- (La función handleChange es idéntica) ---
    const handleChange = (e: any) => {
        const current = e.currentTarget;
        const target = e.target;
        const name = (current && (current.name || (current.getAttribute && current.getAttribute('name'))))
            || (target && (target.name || (target.getAttribute && target.getAttribute('name')))) || '';
        const value = (e && e.detail && e.detail.value !== undefined) ? e.detail.value
            : (target && (target.value !== undefined ? target.value : (target.getAttribute && target.getAttribute('value')))) || '';

        setFormData(prevState => {
            const converted = name === 'secuencia' ? (Number(value) || 0) : value;
            const updatedState = {
                ...prevState,
                [name]: converted
            } as TableParentRow;
            latestFormRef.current = updatedState;
            return updatedState;
        });
    };

    // --- Manejadores del Modal ---
    const openModal = () => {
        // Asegura que solo se abra si hay un label seleccionado
        if (!label) {
            console.error("No se puede actualizar, no hay ningún catálogo seleccionado.");
            return;
        }
        // Los datos ya se cargaron con el useEffect.
        // Solo reseteamos errores y abrimos.
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);

        if (label) {
            setFormData(label);
            latestFormRef.current = label;
            const tokens = label.indice ? label.indice.split(',').filter(t => t.trim() !== '') : [];
            setIndiceTokens(tokens.map(t => t.trim()));
            setInputValue('');
        }
        setErrors({});
    };

    // --- Manejador para ComboBox ---
    const handleComboBoxChange = (e: any, fieldName: 'idsociedad' | 'idcedi') => {
        const selectedItem = e.detail.item;
        const inputValue = e.target.value;

        let newId = '0';
        let newText = inputValue;

        const options = fieldName === 'idsociedad' ? sociedadOptions : cediOptions;

        if (selectedItem) {
            newText = selectedItem.text;
            const option = options.find(o => o.valor === newText);
            if (option) {
                newId = option.idvalor || option.valor || '0';
            }
        } else {
            const option = options.find(o => o.valor === inputValue);
            if (option) {
                newId = option.idvalor || option.valor || '0';
            }
        }

        setComboInputs(prev => ({
            ...prev,
            [fieldName]: newText
        }));

        setFormData(prevState => {
            const updatedState = {
                ...prevState,
                [fieldName]: newId
            };

            // If society changes to 0 (TODOS), set CEDI to 0 (TODOS) automatically
            // Logic aligned with ModalNewCatalogo
            if (fieldName === 'idsociedad' && (newId === '0')) {
                updatedState.idcedi = '0';
                setComboInputs(prev => ({ ...prev, idcedi: 'TODOS' }));
            }

            latestFormRef.current = updatedState;
            return updatedState;
        });
    };

    const handleSubmit = () => {
        const snapshot = { ...(latestFormRef.current || formData) };

        if (!validate(snapshot)) {
            setShowErrorDialog(true);
            return;
        }

        addOperation({
            collection: 'labels',
            action: 'UPDATE',
            payload: {
                id: snapshot.idetiqueta,
                updates: {
                    // IDETIQUETA: snapshot.idetiqueta, // Removed to prevent ID modification error
                    IDSOCIEDAD: Number(snapshot.idsociedad),
                    IDCEDI: Number(snapshot.idcedi),
                    ETIQUETA: snapshot.etiqueta,
                    INDICE: snapshot.indice,
                    COLECCION: snapshot.coleccion,
                    SECCION: snapshot.seccion,
                    SECUENCIA: Number(snapshot.secuencia) || 0,
                    IMAGEN: snapshot.imagen,
                    ROUTE: snapshot.ruta,
                    DESCRIPCION: snapshot.descripcion,
                }
            }
        });

        closeModal();
    };

    return (
        <>
            <Button design="Transparent" icon="edit" onClick={openModal} accessibleName="Editar Catalogo" />
            <ValidationErrorDialog
                open={showErrorDialog}
                errors={errors}
                onClose={() => setShowErrorDialog(false)}
                title="Errores al Actualizar Catálogo"
            />
            <Dialog
                open={isModalOpen}
                onClose={closeModal}
                headerText='Actualizar Catalogo'
                footer={
                    <FlexBox justifyContent={FlexBoxJustifyContent.End} fitContainer style={{ paddingBlock: '0.25rem' }}>
                        <Button onClick={handleSubmit}>Actualizar</Button>
                        <Button onClick={closeModal}>Cancelar</Button>
                    </FlexBox>
                }
            >
                <Form>
                    <FormGroup headerText='Informacion del Catalogo'>

                        <FormItem labelContent={<Label required>ID de la etiqueta</Label>}>
                            <Input
                                name="idetiqueta"
                                value={formData.idetiqueta}
                                onInput={handleChange}
                                valueState={errors.idetiqueta ? "Negative" : "None"}
                                valueStateMessage={<div slot="valueStateMessage">{errors.idetiqueta}</div>}
                                disabled // ID usually not editable
                            />
                        </FormItem>

                        <FormItem labelContent={<Label >IDSOCIEDAD</Label>}>
                            <ComboBox
                                name="idsociedad"
                                value={comboInputs.idsociedad}
                                onSelectionChange={(e) => handleComboBoxChange(e, 'idsociedad')}
                                onInput={(e) => handleComboBoxChange(e, 'idsociedad')}
                                placeholder="Seleccione Sociedad"
                                valueState={errors.idsociedad ? "Negative" : "None"}
                                valueStateMessage={<div slot="valueStateMessage">{errors.idsociedad}</div>}
                            >
                                {sociedadOptions.map((option) => (
                                    <ComboBoxItem key={option.idvalor} text={option.valor} />
                                ))}
                            </ComboBox>
                        </FormItem>

                        <FormItem labelContent={<Label>IDCEDI</Label>}>
                            <ComboBox
                                name="idcedi"
                                value={comboInputs.idcedi}
                                onSelectionChange={(e) => handleComboBoxChange(e, 'idcedi')}
                                onInput={(e) => handleComboBoxChange(e, 'idcedi')}
                                placeholder="Seleccione CEDI"
                                valueState={errors.idcedi ? "Negative" : "None"}
                                valueStateMessage={<div slot="valueStateMessage">{errors.idcedi}</div>}
                                disabled={!formData.idsociedad || formData.idsociedad === '0'}
                            >
                                {cediOptions
                                    .filter(option => Number(option.idvalorpa) === Number(formData.idsociedad) || (option.idvalor === '0' && formData.idsociedad === '0'))
                                    .map((option) => (
                                        <ComboBoxItem key={option.idvalor} text={option.valor} />
                                    ))}
                            </ComboBox>
                        </FormItem>

                        <FormItem labelContent={<Label required>ETIQUETA</Label>}>
                            <Input
                                name="etiqueta"
                                value={formData.etiqueta}
                                onInput={handleChange}
                                valueState={errors.etiqueta ? "Negative" : "None"}
                                valueStateMessage={<div slot="valueStateMessage">{errors.etiqueta}</div>}
                            />
                        </FormItem>

                        <FormItem labelContent={<Label required>INDICE</Label>}>
                            <MultiInput
                                name="indice"
                                value={inputValue}
                                placeholder="Escriba y presione Enter"
                                valueState={errors.indice ? "Negative" : "None"}
                                valueStateMessage={<div slot="valueStateMessage">{errors.indice}</div>}

                                tokens={indiceTokens.map((tokenText, index) => (
                                    <Token key={index} text={tokenText} />
                                ))}

                                onInput={(e) => setInputValue(e.target.value)}

                                onTokenDelete={(e) => {
                                    if (!e.detail.tokens || e.detail.tokens.length === 0) return;
                                    const deletedText = e.detail.tokens[0].text;
                                    const newTokens = indiceTokens.filter((t) => t !== deletedText);
                                    setIndiceTokens(newTokens);

                                    const newIndiceString = newTokens.join(',');
                                    const fakeEvent = { currentTarget: { getAttribute: () => 'indice' }, detail: { value: newIndiceString } };
                                    handleChange(fakeEvent);
                                }}

                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && inputValue.trim() !== '') {
                                        e.preventDefault();
                                        const newText = inputValue.trim();
                                        if (!indiceTokens.includes(newText)) {
                                            const newTokens = [...indiceTokens, newText];
                                            setIndiceTokens(newTokens);

                                            const newIndiceString = newTokens.join(',');
                                            const fakeEvent = { currentTarget: { getAttribute: () => 'indice' }, detail: { value: newIndiceString } };
                                            handleChange(fakeEvent);
                                        }
                                        setInputValue('');
                                    }
                                }}

                                onPaste={(e) => {
                                    e.preventDefault();
                                    const pasteText = e.clipboardData.getData('text');
                                    const pastedTokens = pasteText.split(',')
                                        .map(t => t.trim())
                                        .filter(t => t !== '' && !indiceTokens.includes(t));

                                    if (pastedTokens.length > 0) {
                                        const newTokens = [...indiceTokens, ...pastedTokens];
                                        setIndiceTokens(newTokens);

                                        const newIndiceString = newTokens.join(',');
                                        const fakeEvent = { currentTarget: { getAttribute: () => 'indice' }, detail: { value: newIndiceString } };
                                        handleChange(fakeEvent);
                                        setInputValue('');
                                    }
                                }}

                                onBlur={() => {
                                    const newText = inputValue.trim();
                                    if (newText !== '') {
                                        if (!indiceTokens.includes(newText)) {
                                            const newTokens = [...indiceTokens, newText];
                                            setIndiceTokens(newTokens);

                                            const newIndiceString = newTokens.join(',');
                                            const fakeEvent = { currentTarget: { getAttribute: () => 'indice' }, detail: { value: newIndiceString } };
                                            handleChange(fakeEvent);
                                        }
                                        setInputValue('');
                                    }
                                }}
                            />
                        </FormItem>

                        <FormItem labelContent={<Label required>COLECCION</Label>}>
                            <Input
                                name="coleccion"
                                value={formData.coleccion}
                                onInput={handleChange}
                                valueState={errors.coleccion ? "Negative" : "None"}
                                valueStateMessage={<div slot="valueStateMessage">{errors.coleccion}</div>}
                            />
                        </FormItem>

                        <FormItem labelContent={<Label required>SECCION</Label>}>
                            <Input
                                name="seccion"
                                value={formData.seccion}
                                onInput={handleChange}
                                valueState={errors.seccion ? "Negative" : "None"}
                                valueStateMessage={<div slot="valueStateMessage">{errors.seccion}</div>}
                            />
                        </FormItem>

                        <FormItem labelContent={<Label>SECUENCIA</Label>}>
                            <Input
                                name="secuencia"
                                type="Number"
                                value={String(formData.secuencia ?? '')}
                                onInput={handleChange}
                                valueState={errors.secuencia ? "Negative" : "None"}
                                valueStateMessage={<div slot="valueStateMessage">{errors.secuencia}</div>}
                            />
                        </FormItem>

                        <FormItem labelContent={<Label>Imagen</Label>}>
                            <Input name="imagen" value={formData.imagen} onInput={handleChange} />
                        </FormItem>

                        <FormItem labelContent={<Label>Ruta</Label>}>
                            <Input name="ruta" value={formData.ruta} onInput={handleChange} />
                        </FormItem>

                        <FormItem labelContent={<Label>Descripcion</Label>}>
                            <Input name="descripcion" value={formData.descripcion} onInput={handleChange} />
                        </FormItem>

                    </FormGroup>
                </Form>
            </Dialog>
        </>
    );
}

export default ModalUpdateCatalogo;