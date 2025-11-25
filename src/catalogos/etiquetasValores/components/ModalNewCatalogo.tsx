// ModalNewCatalogo.tsx
import { Button, Dialog, FlexBox, FlexBoxJustifyContent, Form, FormGroup, FormItem, Input, Label, StepInput, MultiInput, Token } from '@ui5/webcomponents-react';
import { useState, useRef } from 'react';
import { addOperation } from '../store/labelStore';

const initialFormState = {
  IDETIQUETA: '',
  IDSOCIEDAD: 0,
  IDCEDI: 0,
  ETIQUETA: '',
  INDICE: '',
  COLECCION: '',
  SECCION: '',
  SECUENCIA: 0,
  IMAGEN: '',
  ROUTE: '',
  DESCRIPCION: '',
};

interface ModalNewCatalogoProps {
  compact?: boolean;
}

function ModalNewCatalogo({ compact = false }: ModalNewCatalogoProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const latestFormRef = useRef(initialFormState);

  const [inputValue, setInputValue] = useState('');
  const [indiceTokens, setIndiceTokens] = useState<string[]>([]);

  const openModal = () => {
    setFormData(initialFormState);
    latestFormRef.current = initialFormState;
    setErrors({});
    setIndiceTokens([]);
    setInputValue('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setErrors({});
  };

  const validate = (data: typeof initialFormState) => {
    const newErrors: any = {};

    // --- Campos de Texto (Strings) ---
    if (!data.IDETIQUETA) {
      newErrors.IDETIQUETA = 'IDETIQUETA es requerido.';
    } else if (typeof data.IDETIQUETA !== 'string') {
      newErrors.IDETIQUETA = 'Debe ser texto.';
    }

    if (!data.ETIQUETA) {
      newErrors.ETIQUETA = 'ETIQUETA es requerido.';
    } else if (typeof data.ETIQUETA !== 'string') {
      newErrors.ETIQUETA = 'Debe ser texto.';
    }

    if (!data.INDICE) {
      newErrors.INDICE = 'INDICE es requerido.';
    } else if (typeof data.INDICE !== 'string') {
      newErrors.INDICE = 'Debe ser texto.';
    }

    if (!data.COLECCION) {
      newErrors.COLECCION = 'COLECCION es requerido.';
    } else if (typeof data.COLECCION !== 'string') {
      newErrors.COLECCION = 'Debe ser texto.';
    }

    if (!data.SECCION) {
      newErrors.SECCION = 'SECCION es requerido.';
    } else if (typeof data.SECCION !== 'string') {
      newErrors.SECCION = 'Debe ser texto.';
    }

    if (typeof data.IMAGEN !== 'string') {
      newErrors.IMAGEN = 'Debe ser texto (opcional).';
    }

    if (typeof data.ROUTE !== 'string') {
      newErrors.ROUTE = 'Debe ser texto (opcional).';
    }

    if (typeof data.DESCRIPCION !== 'string') {
      newErrors.DESCRIPCION = 'Debe ser texto (opcional).';
    }

    // --- Campos Numéricos (Numbers) ---
    if (typeof data.SECUENCIA !== 'number') {
      newErrors.SECUENCIA = 'Debe ser un número (opcional).';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log("Validation result:", isValid, "Errors:", newErrors);
    return isValid;
  };

  const handleChange = (e: any) => {
    const current = e.currentTarget;
    const target = e.target;

    const name = (current && (current.name || (current.getAttribute && current.getAttribute('name'))))
      || (target && (target.name || (target.getAttribute && target.getAttribute('name')))) || '';

    const value = (e && e.detail && e.detail.value !== undefined) ? e.detail.value
      : (target && (target.value !== undefined ? target.value : (target.getAttribute && target.getAttribute('value')))) || '';

    if (!name) {
      console.warn('handleChange no pudo determinar el "name" del campo.');
      return;
    }

    setFormData(prevState => {
      const converted = (name === 'SECUENCIA')
        ? (Number(value) || 0)
        : value;

      const updatedState = {
        ...prevState,
        [name]: converted
      };

      latestFormRef.current = updatedState;

      return updatedState;
    });
  };

  const handleSubmit = () => {
    const snapshot = { ...(latestFormRef.current || formData) };
    
    // Solo validación frontend básica (campos requeridos)
    if (!validate(snapshot)) {
      return; // Mostrar errores en el formulario
    }

    // Agregar operación a la cola (NO ejecutar todavía)
    addOperation({
      collection: 'labels',
      action: 'CREATE',
      payload: {
        ...snapshot,
        SECUENCIA: Number(snapshot.SECUENCIA) || 0,
      }
    });

    // Cerrar modal
    closeModal();
  };

  return (
    <>
      <Button 
        design="Positive" 
        icon="add" 
        onClick={openModal} 
        accessibleName="Crear Nuevo Catalogo"
      >
        {!compact && 'Crear Nuevo Catalogo'}
      </Button>

      <Dialog
        open={isModalOpen}
        onClose={closeModal}
        headerText='Agrega un Catalogo'
        footer={
          <FlexBox justifyContent={FlexBoxJustifyContent.End} fitContainer style={{ paddingBlock: '0.25rem' }}>
            <Button onClick={handleSubmit}>Crear</Button>
            <Button onClick={closeModal}>Cerrar</Button>
          </FlexBox>
        }
      >
        <Form>
          <FormGroup headerText='Informacion del Catalogo'>
            <FormItem labelContent={<Label required>ID de la etiqueta</Label>}>
              <Input
                name="IDETIQUETA"
                value={formData.IDETIQUETA}
                onInput={handleChange}
                placeholder="Escribe el ID único (Ej: LBL-001)"
                valueState={errors.IDETIQUETA ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.IDETIQUETA}</div>}
              />
            </FormItem>

            <FormItem labelContent={<Label required>IDSOCIEDAD</Label>}>
              <StepInput
                name="IDSOCIEDAD"
                value={formData.IDSOCIEDAD}
                onInput={handleChange}
                valueState={errors.IDSOCIEDAD ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.IDSOCIEDAD}</div>}
              />
            </FormItem>

            <FormItem labelContent={<Label required>IDCEDI</Label>}>
              <StepInput
                name="IDCEDI"
                value={formData.IDCEDI}
                onInput={handleChange}
                valueState={errors.IDCEDI ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.IDCEDI}</div>}
              />
            </FormItem>

            <FormItem labelContent={<Label required>ETIQUETA</Label>}>
              <Input
                name="ETIQUETA"
                value={formData.ETIQUETA}
                onInput={handleChange}
                placeholder="Nombre visible (Ej: Menú Principal)"
                valueState={errors.ETIQUETA ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.ETIQUETA}</div>}
              />
            </FormItem>

            <FormItem labelContent={<Label required>INDICE</Label>}>
              <MultiInput
                name="INDICE"
                value={inputValue}
                placeholder="Escriba y presione Enter o pegue valores separados por comas"
                valueState={errors.INDICE ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.INDICE}</div>}
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
                  const fakeEvent = { currentTarget: { getAttribute: () => 'INDICE' }, detail: { value: newIndiceString } };
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
                      const fakeEvent = { currentTarget: { getAttribute: () => 'INDICE' }, detail: { value: newIndiceString } };
                      handleChange(fakeEvent);
                    }
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
                      const fakeEvent = { currentTarget: { getAttribute: () => 'INDICE' }, detail: { value: newIndiceString } };
                      handleChange(fakeEvent);
                    }
                    setInputValue('');
                  }
                }}
              />
            </FormItem>

            <FormItem labelContent={<Label required>COLECCION</Label>}>
              <Input
                name="COLECCION"
                value={formData.COLECCION}
                onInput={handleChange}
                placeholder="Nombre de la colección (Ej: Catálogos)"
                valueState={errors.COLECCION ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.COLECCION}</div>}
              />
            </FormItem>

            <FormItem labelContent={<Label required>SECCION</Label>}>
              <Input
                name="SECCION"
                value={formData.SECCION}
                onInput={handleChange}
                placeholder="Nombre de la sección (Ej: Home)"
                valueState={errors.SECCION ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.SECCION}</div>}
              />
            </FormItem>

            <FormItem labelContent={<Label>SECUENCIA</Label>}>
              <StepInput
                name="SECUENCIA"
                value={formData.SECUENCIA}
                onInput={handleChange}
                valueState={errors.SECUENCIA ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.SECUENCIA}</div>}
              />
            </FormItem>

            <FormItem labelContent={<Label>Imagen</Label>}>
              <Input
                name="IMAGEN"
                value={formData.IMAGEN}
                onInput={handleChange}
                placeholder="Ej: /assets/imagenes/logo.png"
                valueState={errors.IMAGEN ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.IMAGEN}</div>}
              />
            </FormItem>

            <FormItem labelContent={<Label>Ruta</Label>}>
              <Input
                name="ROUTE"
                value={formData.ROUTE}
                onInput={handleChange}
                placeholder="Ruta de navegación (Ej: /home)"
                valueState={errors.ROUTE ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.ROUTE}</div>}
              />
            </FormItem>

            <FormItem labelContent={<Label>Descripcion</Label>}>
              <Input
                name="DESCRIPCION"
                value={formData.DESCRIPCION}
                onInput={handleChange}
                placeholder="Escribe una descripción breve"
                valueState={errors.DESCRIPCION ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.DESCRIPCION}</div>}
              />
            </FormItem>
          </FormGroup>
        </Form>
      </Dialog>
    </>
  );
}

export default ModalNewCatalogo;