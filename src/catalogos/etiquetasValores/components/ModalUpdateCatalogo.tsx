import { Button, FlexBox, FlexBoxJustifyContent, Form, FormGroup, FormItem, Input, Label, Dialog, MultiInput, Token} from '@ui5/webcomponents-react';
import { useState, useEffect, useRef } from 'react';
import { addOperation } from '../store/labelStore';
import { TableParentRow } from '../services/labelService';
import ValidationErrorDialog from './ValidationErrorDialog';

interface ModalUpdateCatalogoProps {
    label: TableParentRow | null;
    compact?: boolean;
}

function ModalUpdateCatalogo({ label, compact = false }: ModalUpdateCatalogoProps) {
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

    // Estados para el MultiInput 
    const [inputValue, setInputValue] = useState('');
    const [indiceTokens, setIndiceTokens] = useState<string[]>([]);

    // Estado para la visibilidad del Modal
    const [isModalOpen, setIsModalOpen] = useState(false);

     const [showErrorDialog, setShowErrorDialog] = useState(false);

    // Este useEffect se ejecuta cuando el 'label' seleccionado (la prop) cambia
    useEffect(() => {
        if (label) {
            console.log('Label recibido en ModalUpdate:', label);
            // Pre-carga el estado del formulario y los tokens
            setFormData(label);
            latestFormRef.current = label;

            const tokens = label.indice ? label.indice.split(',').filter(t => t.trim() !== '') : [];
            setIndiceTokens(tokens.map(t => t.trim()));
            setInputValue('');
        } else {
            // Resetea si no hay label seleccionado
            setFormData(initialFormState);
            latestFormRef.current = initialFormState;
            setIndiceTokens([]);
            setInputValue('');
        }
    }, [label]); // Depende solo de 'label'

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

    // Manejadores del Modal
    const openModal = () => {
        // Asegura que solo se abra si hay un label seleccionado
        if (!label) {
            console.error("No se puede actualizar, no hay ningún catálogo seleccionado.");
            return;
        }
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

    // handleSubmit ya no recibe 'close' como argumento
const handleSubmit = () => { 
  const snapshot: TableParentRow = { ...(latestFormRef.current || formData) };

  if (!validate(snapshot)) {
    setShowErrorDialog(true);
    return;
  }

  const updatePayload = {
    id: label!.idetiqueta,
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
  
  closeModal(); // Cierra inmediatamente
};

    // --- NUEVO RENDER ---
    return <>
        <Button
            design="Emphasized"
            icon="edit"
            accessibleName="Actualizar Catalogo" // Accesibilidad para lectores de pantalla
            onClick={openModal} // <-- Llama a openModal
            disabled={!label}   // <-- Deshabilita el botón si no hay label
        >
            {!compact && 'Actualizar Catalogo'}
        </Button>
        <ValidationErrorDialog
            open={showErrorDialog}
            errors={errors}
            onClose={() => setShowErrorDialog(false)}
            title="Errores al Actualizar Catálogo"
        />
        {/* El Dialog declarativo */}
        <Dialog
            open={isModalOpen}
            onClose={closeModal}
            headerText='Actualiza el Catalogo'
            footer={
                <FlexBox justifyContent={FlexBoxJustifyContent.End} fitContainer style={{ paddingBlock: '0.25rem' }}>
                    <Button onClick={handleSubmit}>Actualizar</Button>
                    <Button onClick={closeModal}>Cancelar</Button>
                </FlexBox>
            }
        >
            {/* El Form ahora es un hijo directo y se re-renderizará con el estado */}
            <Form>
                <FormGroup headerText='Informacion del Catalogo'>

                    <FormItem labelContent={<Label required>ID de la etiqueta</Label>}>
                        <Input 
                            name="idetiqueta" 
                            value={formData.idetiqueta} 
                            onInput={handleChange}
                            valueState={errors.idetiqueta ? "Negative" : "None"}
                            valueStateMessage={<div slot="valueStateMessage">{errors.idetiqueta}</div>}
                        />
                    </FormItem>

                    <FormItem labelContent={<Label >IDSOCIEDAD</Label>}>
                        <Input 
                            type="Number" 
                            name="idsociedad" 
                            value={formData.idsociedad.toString() ?? ''} 
                            onInput={handleChange}
                            valueState={errors.idsociedad ? "Negative" : "None"}
                            valueStateMessage={<div slot="valueStateMessage">{errors.idsociedad}</div>}
                        />
                    </FormItem>

                    <FormItem labelContent={<Label>IDCEDI</Label>}>
                        <Input 
                            type="Number" 
                            name="idcedi" 
                            value={formData.idcedi.toString()} 
                            onInput={handleChange}
                            valueState={errors.idcedi ? "Negative" : "None"}
                            valueStateMessage={<div slot="valueStateMessage">{errors.idcedi}</div>}
                        />
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
                            name="indice" // Usado por 'validate'
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

                                // ¡Usamos handleChange para actualizar el estado principal!
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

                            // Agregamos onPaste (faltaba en tu código)
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
}

export default ModalUpdateCatalogo;