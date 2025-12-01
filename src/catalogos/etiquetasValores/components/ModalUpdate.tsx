import {
    Button,
    FlexBox,
    FlexBoxJustifyContent,
    Form,
    FormGroup,
    FormItem,
    Input,
    Label,
    Dialog,
    MultiInput,
    Token,
    ComboBox,
    ComboBoxItem
} from '@ui5/webcomponents-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { addOperation, getLabels, subscribe } from '../store/labelStore';
import { TableParentRow, TableSubRow } from '../services/labelService';
import { ValueHelpSelector, LabelData } from './ValueHelpSelector';
import ValidationErrorDialog from './ValidationErrorDialog';

interface ModalUpdateProps {
    compact?: boolean;
    selectedLabels: TableParentRow[];
    selectedValores: TableSubRow[];
    selectedValorParent: TableParentRow | null;
}

type UpdateMode = 'catalogo' | 'valor' | null;

function ModalUpdate({
    compact = false,
    selectedLabels,
    selectedValores,
    selectedValorParent
}: ModalUpdateProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updateMode, setUpdateMode] = useState<UpdateMode>(null);
    const [errors, setErrors] = useState<any>({});
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [buttonText, setButtonText] = useState('Actualizar');

    // Estados para Catálogo
    const initialCatalogoState: TableParentRow = {
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
    const [catalogoData, setCatalogoData] = useState<TableParentRow>(initialCatalogoState);
    const catalogoRef = useRef<TableParentRow>(initialCatalogoState);
    const [inputValue, setInputValue] = useState('');
    const [indiceTokens, setIndiceTokens] = useState<string[]>([]);

    // Estados para ComboBox en Catálogo
    const [sociedadOptions, setSociedadOptions] = useState<TableSubRow[]>([]);
    const [cediOptions, setCediOptions] = useState<TableSubRow[]>([]);
    const [comboInputs, setComboInputs] = useState({ idsociedad: '', idcedi: '' });

    // Estados para Valor
    const initialValorState = {
        IDVALOR: "",
        VALOR: "",
        IDVALORPA: "",
        ALIAS: "",
        SECUENCIA: "0",
        DESCRIPCION: "",
        IMAGEN: "",
        ROUTE: "",
    };
    const [valorData, setValorData] = useState(initialValorState);
    const valorRef = useRef(initialValorState);
    const [allLabels, setAllLabels] = useState<TableParentRow[]>([]);
    const [selectedIdValorPa, setSelectedIdValorPa] = useState<string | null>(null);

    // Cargar etiquetas para ValueHelpSelector y ComboBoxes
    useEffect(() => {
        const loadData = () => {
            const labels = getLabels();
            const parents = labels.filter((label) => label.parent);
            setAllLabels(parents);

            const sociedadLabel = labels.find(l => l.etiqueta === 'SOCIEDAD');
            const cediLabel = labels.find(l => l.etiqueta === 'Catálogo de Centros de Distribución');

            setSociedadOptions(sociedadLabel?.subRows || []);
            setCediOptions(cediLabel?.subRows || []);
        };

        loadData();

        const unsubscribe = subscribe(() => {
            loadData();
        });

        return () => unsubscribe();
    }, []);

    // Determinar estado del botón principal
    useEffect(() => {
        const hasOneCatalogo = selectedLabels.length === 1;
        const hasOneValor = selectedValores.length === 1 && selectedValorParent !== null;

        if (hasOneCatalogo && !hasOneValor) {
            setIsButtonDisabled(false);
            setButtonText('Actualizar Catálogo');
        } else if (hasOneValor && !hasOneCatalogo) {
            setIsButtonDisabled(false);
            setButtonText('Actualizar Valor');
        } else {
            setIsButtonDisabled(true);
            setButtonText('Actualizar');
        }
    }, [selectedLabels, selectedValores, selectedValorParent]);

    // Validación para Catálogo
    const validateCatalogo = (data: Partial<TableParentRow>) => {
        const newErrors: any = {};
        if (!data.etiqueta) newErrors.etiqueta = 'ETIQUETA es requerido.';
        return Object.keys(newErrors).length === 0;
    };

    // Validación para Valor
    const validateValor = (data: typeof initialValorState) => {
        const newErrors: any = {};
        if (!data.VALOR) newErrors.VALOR = "VALOR es requerido.";
        if (data.SECUENCIA && isNaN(Number(data.SECUENCIA))) {
            newErrors.SECUENCIA = "El valor debe ser numérico.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handlers para Catálogo
    const handleCatalogoChange = (e: any) => {
        const current = e.currentTarget;
        const target = e.target;
        const name = (current && (current.name || (current.getAttribute && current.getAttribute('name'))))
            || (target && (target.name || (target.getAttribute && target.getAttribute('name')))) || '';
        const value = (e && e.detail && e.detail.value !== undefined) ? e.detail.value
            : (target && (target.value !== undefined ? target.value : (target.getAttribute && target.getAttribute('value')))) || '';

        setCatalogoData(prevState => {
            const converted = name === 'secuencia' ? (Number(value) || 0) : value;
            const updatedState = {
                ...prevState,
                [name]: converted
            } as TableParentRow;
            catalogoRef.current = updatedState;
            return updatedState;
        });
    };

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

        setCatalogoData(prevState => {
            const updatedState = {
                ...prevState,
                [fieldName]: newId
            };
            catalogoRef.current = updatedState;
            return updatedState;
        });
    };

    // Handlers para Valor
    const handleValorChange = (e: any) => {
        const name = e.target.name;
        const value = e.target.value;
        if (!name) return;
        setValorData((prevState) => {
            const updatedState = { ...prevState, [name]: value };
            valorRef.current = updatedState;
            return updatedState;
        });
    };

    const handleIdValorPaSelect = (idvalor: string | null) => {
        setSelectedIdValorPa(idvalor);
        setValorData((prevState) => {
            const updatedState = {
                ...prevState,
                IDVALORPA: idvalor || "",
            };
            valorRef.current = updatedState;
            return updatedState;
        });
    };

    // Transformar allLabels para ValueHelpSelector
    const valueHelpData = useMemo<LabelData[]>(() => {
        return allLabels.map((label) => ({
            parent: label.parent,
            idsociedad: label.idsociedad,
            idcedi: label.idcedi,
            idetiqueta: label.idetiqueta,
            etiqueta: label.etiqueta,
            indice: label.indice,
            coleccion: label.coleccion,
            seccion: label.seccion,
            secuencia: label.secuencia,
            imagen: label.imagen,
            ruta: label.ruta,
            descripcion: label.descripcion,
            subRows: (label.subRows || []).map((subRow) => ({
                idsociedad: subRow.idsociedad,
                idcedi: subRow.idcedi,
                idetiqueta: subRow.idetiqueta,
                idvalor: subRow.idvalor,
                idvalorpa: subRow.idvalorpa,
                valor: subRow.valor,
                alias: subRow.alias,
                secuencia: subRow.secuencia,
                imagen: subRow.imagen,
                ruta: subRow.ruta,
                descripcion: subRow.descripcion,
                indice: subRow.indice,
                coleccion: subRow.coleccion,
                seccion: subRow.seccion,
            })),
        }));
    }, [allLabels]);

    // Abrir modal
    const openModal = () => {
        const hasOneCatalogo = selectedLabels.length === 1;
        const hasOneValor = selectedValores.length === 1 && selectedValorParent !== null;

        if (hasOneCatalogo && !hasOneValor) {
            // Modo Catálogo
            const label = selectedLabels[0];
            setUpdateMode('catalogo');
            setCatalogoData(label);
            catalogoRef.current = label;
            const tokens = label.indice ? label.indice.split(',').filter(t => t.trim() !== '') : [];
            setIndiceTokens(tokens.map(t => t.trim()));
            setInputValue('');

            // Set initial combo inputs
            const initialSociedadText = sociedadOptions.find(o => o.idvalor === label.idsociedad || o.valor === label.idsociedad)?.valor || label.idsociedad || '';
            const initialCediText = cediOptions.find(o => o.idvalor === label.idcedi || o.valor === label.idcedi)?.valor || label.idcedi || '';

            setComboInputs({
                idsociedad: initialSociedadText,
                idcedi: initialCediText
            });

        } else if (hasOneValor && !hasOneCatalogo) {
            // Modo Valor
            const valor = selectedValores[0];
            const idValorPaInicial = valor.idvalorpa || null;
            setUpdateMode('valor');
            const formDataFromProp = {
                IDVALOR: valor.idvalor,
                VALOR: valor.valor,
                IDVALORPA: idValorPaInicial || "",
                ALIAS: valor.alias || "",
                SECUENCIA: valor.secuencia.toString() || "0",
                DESCRIPCION: valor.descripcion || "",
                IMAGEN: valor.imagen || "",
                ROUTE: valor.ruta || "",
            };
            setValorData(formDataFromProp);
            valorRef.current = formDataFromProp;
            setSelectedIdValorPa(idValorPaInicial);
        } else {
            return;
        }

        setErrors({});
        setIsModalOpen(true);
    };

    // Cerrar modal
    const closeModal = () => {
        setIsModalOpen(false);
        setUpdateMode(null);
        setErrors({});

        // Reset Catálogo
        if (selectedLabels.length === 1) {
            const label = selectedLabels[0];
            setCatalogoData(label);
            catalogoRef.current = label;
            const tokens = label.indice ? label.indice.split(',').filter(t => t.trim() !== '') : [];
            setIndiceTokens(tokens.map(t => t.trim()));
            setInputValue('');
        }

        // Reset Valor
        setValorData(initialValorState);
        valorRef.current = initialValorState;
        setSelectedIdValorPa(null);
    };

    // Submit
    const handleSubmit = async () => {
        if (updateMode === 'catalogo') {
            const snapshot: TableParentRow = { ...(catalogoRef.current || catalogoData) };

            if (!validateCatalogo(snapshot)) {
                setShowErrorDialog(true);
                return;
            }

            const label = selectedLabels[0];
            const updatePayload = {
                id: label.idetiqueta,
                updates: {
                    IDETIQUETA: snapshot.idetiqueta,
                    IDSOCIEDAD: Number(snapshot.idsociedad) || 0,
                    IDCEDI: Number(snapshot.idcedi) || 0,
                    COLECCION: snapshot.coleccion,
                    SECCION: snapshot.seccion,
                    SECUENCIA: Number(snapshot.secuencia) || 0,
                    INDICE: snapshot.indice,
                    IMAGEN: snapshot.imagen,
                    ROUTE: snapshot.ruta,
                    DESCRIPCION: snapshot.descripcion,
                }
            };

            addOperation({
                collection: 'labels',
                action: 'UPDATE',
                payload: updatePayload
            });

            closeModal();

        } else if (updateMode === 'valor') {
            const snapshot = { ...(valorRef.current || valorData) };

            if (!validateValor(snapshot) || !selectedValorParent) {
                setShowErrorDialog(true);
                return;
            }

            const valorPaFinal = !snapshot.IDVALORPA ? null : snapshot.IDVALORPA;
            const updatePayload = {
                id: snapshot.IDVALOR,
                IDETIQUETA: selectedValorParent.idetiqueta,
                updates: {
                    VALOR: snapshot.VALOR,
                    IDVALORPA: valorPaFinal,
                    ALIAS: snapshot.ALIAS,
                    SECUENCIA: Number(snapshot.SECUENCIA) || 0,
                    DESCRIPCION: snapshot.DESCRIPCION,
                    IMAGEN: snapshot.IMAGEN,
                    ROUTE: snapshot.ROUTE,
                }
            };

            addOperation({
                collection: "values",
                action: "UPDATE",
                payload: updatePayload
            });

            closeModal();
        }
    };

    return (
        <>
            <Button
                design="Emphasized"
                icon="edit"
                accessibleName="Actualizar"
                onClick={openModal}
                disabled={isButtonDisabled}
            >
                {!compact && buttonText}
            </Button>

            <ValidationErrorDialog
                open={showErrorDialog}
                errors={errors}
                onClose={() => setShowErrorDialog(false)}
                title={updateMode === 'catalogo' ? "Errores al Actualizar Catálogo" : "Errores al Actualizar Valor"}
            />

            <Dialog
                open={isModalOpen}
                onClose={closeModal}
                headerText={updateMode === 'catalogo' ? 'Actualiza el Catalogo' : 'Actualizar Valor'}
                style={updateMode === 'valor' ? { width: "700px" } : undefined}
                footer={
                    <FlexBox justifyContent={FlexBoxJustifyContent.End} fitContainer style={{ paddingBlock: '0.25rem' }}>
                        <Button onClick={handleSubmit}>Actualizar</Button>
                        <Button onClick={closeModal}>Cancelar</Button>
                    </FlexBox>
                }
            >
                {updateMode === 'catalogo' && (
                    <Form>
                        <FormGroup headerText='Informacion del Catalogo'>
                            <FormItem labelContent={<Label required>ID de la etiqueta</Label>}>
                                <Input
                                    name="idetiqueta"
                                    value={catalogoData.idetiqueta}
                                    onInput={handleCatalogoChange}
                                    valueState={errors.idetiqueta ? "Negative" : "None"}
                                    valueStateMessage={<div slot="valueStateMessage">{errors.idetiqueta}</div>}
                                />
                            </FormItem>

                            <FormItem labelContent={<Label>IDSOCIEDAD</Label>}>
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
                                    disabled={!catalogoData.idsociedad || catalogoData.idsociedad === '0'}
                                >
                                    {cediOptions
                                        .filter(option => Number(option.idvalorpa) === Number(catalogoData.idsociedad))
                                        .map((option) => (
                                            <ComboBoxItem key={option.idvalor} text={option.valor} />
                                        ))}
                                </ComboBox>
                            </FormItem>

                            <FormItem labelContent={<Label required>ETIQUETA</Label>}>
                                <Input
                                    name="etiqueta"
                                    value={catalogoData.etiqueta}
                                    onInput={handleCatalogoChange}
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
                                        handleCatalogoChange(fakeEvent);
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
                                                handleCatalogoChange(fakeEvent);
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
                                            handleCatalogoChange(fakeEvent);
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
                                                handleCatalogoChange(fakeEvent);
                                            }
                                            setInputValue('');
                                        }
                                    }}
                                />
                            </FormItem>

                            <FormItem labelContent={<Label required>COLECCION</Label>}>
                                <Input
                                    name="coleccion"
                                    value={catalogoData.coleccion}
                                    onInput={handleCatalogoChange}
                                    valueState={errors.coleccion ? "Negative" : "None"}
                                    valueStateMessage={<div slot="valueStateMessage">{errors.coleccion}</div>}
                                />
                            </FormItem>

                            <FormItem labelContent={<Label required>SECCION</Label>}>
                                <Input
                                    name="seccion"
                                    value={catalogoData.seccion}
                                    onInput={handleCatalogoChange}
                                    valueState={errors.seccion ? "Negative" : "None"}
                                    valueStateMessage={<div slot="valueStateMessage">{errors.seccion}</div>}
                                />
                            </FormItem>

                            <FormItem labelContent={<Label>SECUENCIA</Label>}>
                                <Input
                                    name="secuencia"
                                    type="Number"
                                    value={String(catalogoData.secuencia ?? '')}
                                    onInput={handleCatalogoChange}
                                    valueState={errors.secuencia ? "Negative" : "None"}
                                    valueStateMessage={<div slot="valueStateMessage">{errors.secuencia}</div>}
                                />
                            </FormItem>

                            <FormItem labelContent={<Label>Imagen</Label>}>
                                <Input name="imagen" value={catalogoData.imagen} onInput={handleCatalogoChange} />
                            </FormItem>

                            <FormItem labelContent={<Label>Ruta</Label>}>
                                <Input name="ruta" value={catalogoData.ruta} onInput={handleCatalogoChange} />
                            </FormItem>

                            <FormItem labelContent={<Label>Descripcion</Label>}>
                                <Input name="descripcion" value={catalogoData.descripcion} onInput={handleCatalogoChange} />
                            </FormItem>
                        </FormGroup>
                    </Form>
                )}

                {updateMode === 'valor' && selectedValorParent && (
                    <Form>
                        <FormGroup headerText="Información del Catálogo (Padre)">
                            <FormItem labelContent={<Label>Etiqueta Padre</Label>}>
                                <Input value={selectedValorParent.etiqueta || ""} disabled />
                            </FormItem>
                            <FormItem labelContent={<Label>ID Sociedad (Padre)</Label>}>
                                <Input value={selectedValorParent.idsociedad || ""} disabled />
                            </FormItem>
                            <FormItem labelContent={<Label>ID Cedi (Padre)</Label>}>
                                <Input value={selectedValorParent.idcedi || ""} disabled />
                            </FormItem>
                            <FormItem labelContent={<Label>ID Etiqueta (Padre)</Label>}>
                                <Input value={selectedValorParent.idetiqueta || ""} disabled />
                            </FormItem>
                        </FormGroup>

                        <FormGroup headerText="Información del Valor">
                            <FormItem labelContent={<Label required>ID del Valor</Label>}>
                                <Input name="IDVALOR" value={valorData.IDVALOR} disabled />
                            </FormItem>
                            <FormItem labelContent={<Label required>Valor</Label>}>
                                <Input
                                    name="VALOR"
                                    value={valorData.VALOR}
                                    onInput={handleValorChange}
                                    valueState={errors.VALOR ? "Negative" : "None"}
                                    valueStateMessage={<div slot="valueStateMessage">{errors.VALOR}</div>}
                                />
                            </FormItem>
                            <FormItem>
                                <ValueHelpSelector
                                    label="ID Valor Padre (IDVALORPA)"
                                    placeholder="Buscar o seleccionar valor padre..."
                                    data={valueHelpData}
                                    value={selectedIdValorPa}
                                    onSelect={handleIdValorPaSelect}
                                />
                            </FormItem>
                            <FormItem labelContent={<Label>Alias</Label>}>
                                <Input name="ALIAS" value={valorData.ALIAS} onInput={handleValorChange} />
                            </FormItem>
                            <FormItem labelContent={<Label>Secuencia</Label>}>
                                <Input
                                    name="SECUENCIA"
                                    type="Number"
                                    value={valorData.SECUENCIA}
                                    onInput={handleValorChange}
                                    valueState={errors.SECUENCIA ? "Negative" : "None"}
                                    valueStateMessage={<div slot="valueStateMessage">{errors.SECUENCIA}</div>}
                                />
                            </FormItem>
                            <FormItem labelContent={<Label>Imagen</Label>}>
                                <Input name="IMAGEN" value={valorData.IMAGEN} onInput={handleValorChange} />
                            </FormItem>
                            <FormItem labelContent={<Label>Ruta</Label>}>
                                <Input name="ROUTE" value={valorData.ROUTE} onInput={handleValorChange} />
                            </FormItem>
                            <FormItem labelContent={<Label>Descripción</Label>}>
                                <Input name="DESCRIPCION" value={valorData.DESCRIPCION} onInput={handleValorChange} />
                            </FormItem>
                        </FormGroup>
                    </Form>
                )}
            </Dialog>
        </>
    );
}

export default ModalUpdate;