import { Button, Dialog, FlexBox, FlexBoxJustifyContent, Form, FormGroup, FormItem, Input, Label, StepInput, MultiInput, Token, ComboBox, ComboBoxItem } from '@ui5/webcomponents-react';
import { useState, useRef, useEffect } from 'react';
import { addOperation, getLabels } from '../store/labelStore';
import ValidationErrorDialog from './ValidationErrorDialog';
import { TableSubRow } from '../services/labelService';

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
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const latestFormRef = useRef(initialFormState);

  const [inputValue, setInputValue] = useState('');
  const [indiceTokens, setIndiceTokens] = useState<string[]>([]);

  const [sociedadOptions, setSociedadOptions] = useState<TableSubRow[]>([]);
  const [cediOptions, setCediOptions] = useState<TableSubRow[]>([]);
  const [comboInputs, setComboInputs] = useState({ IDSOCIEDAD: '', IDCEDI: '' });

  useEffect(() => {
    if (isModalOpen) {
      const labels = getLabels();
      const sociedadLabel = labels.find(l => l.etiqueta === 'SOCIEDAD');
      const cediLabel = labels.find(l => l.etiqueta === 'Catálogo de Centros de Distribución');

      const todosSociedad: TableSubRow = {
        idsociedad: '0', idcedi: '0', idetiqueta: 'SOCIEDAD', idvalor: '0', idvalorpa: null, valor: 'TODOS', alias: '', secuencia: 0, imagen: null, ruta: null, descripcion: '', indice: '', coleccion: '', seccion: ''
      };
      const todosCedi: TableSubRow = {
        idsociedad: '0', idcedi: '0', idetiqueta: 'Catálogo de Centros de Distribución', idvalor: '0', idvalorpa: '0', valor: 'TODOS', alias: '', secuencia: 0, imagen: null, ruta: null, descripcion: '', indice: '', coleccion: '', seccion: ''
      };

      if (sociedadLabel && sociedadLabel.subRows) {
        setSociedadOptions([todosSociedad, ...sociedadLabel.subRows]);
      } else {
        setSociedadOptions([todosSociedad]);
      }

      if (cediLabel && cediLabel.subRows) {
        setCediOptions([todosCedi, ...cediLabel.subRows]);
      } else {
        setCediOptions([todosCedi]);
      }
    }
  }, [isModalOpen]);

  const openModal = () => {
    setFormData(initialFormState);
    latestFormRef.current = initialFormState;
    setErrors({});
    setIndiceTokens([]);
    setInputValue('');
    setComboInputs({ IDSOCIEDAD: '', IDCEDI: '' });
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

    // Validation for Society and CEDI
    if (data.IDSOCIEDAD === undefined || data.IDSOCIEDAD === null) {
      newErrors.IDSOCIEDAD = 'Debe seleccionar una SOCIEDAD válida.';
    }
    if (data.IDCEDI === undefined || data.IDCEDI === null) {
      newErrors.IDCEDI = 'Debe seleccionar un CEDI válido.';
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

  const handleComboBoxChange = (e: any, fieldName: 'IDSOCIEDAD' | 'IDCEDI') => {
    const selectedItem = e.detail.item;
    const inputValue = e.target.value; // Text currently in the input

    let newId = 0;
    let newText = inputValue;

    const options = fieldName === 'IDSOCIEDAD' ? sociedadOptions : cediOptions;

    if (selectedItem) {
      newText = selectedItem.text;
      const option = options.find(o => o.valor === newText);
      if (option) {
        newId = Number(option.idvalor) || Number(option.valor) || 0;
      }
    } else {
      // User typed something. Try to match it to an option by text
      const option = options.find(o => o.valor === inputValue);
      if (option) {
        newId = Number(option.idvalor) || Number(option.valor) || 0;
      }
    }

    // Update display text
    setComboInputs(prev => ({
      ...prev,
      [fieldName]: newText
    }));

    // Update stored ID
    setFormData(prevState => {
      const updatedState = {
        ...prevState,
        [fieldName]: newId
      };

      // Always reset CEDI when society changes to prevent invalid combinations
      if (fieldName === 'IDSOCIEDAD') {
        updatedState.IDCEDI = 0;
        setComboInputs(prev => ({ ...prev, IDCEDI: 'TODOS' }));
      }

      latestFormRef.current = updatedState;
      return updatedState;
    });
  };

  const handleSubmit = () => {
    const snapshot = { ...(latestFormRef.current || formData) };

    // Solo validación frontend
    if (!validate(snapshot)) {
      setShowErrorDialog(true);
      return;
    }

    // Agregar a la cola (sin try/catch)
    addOperation({
      collection: 'labels',
      action: 'CREATE',
      payload: {
        ...snapshot,
        SECUENCIA: Number(snapshot.SECUENCIA) || 0,
      }
    });

    closeModal();
  };

  return (
    <>
      <Button design="Positive" icon="add" onClick={openModal} accessibleName="Crear Nuevo Catalogo">
        {!compact && 'Crear Nuevo Catalogo'}
      </Button>
      <ValidationErrorDialog
        open={showErrorDialog}
        errors={errors}
        onClose={() => setShowErrorDialog(false)}
        title="Errores al Crear Catálogo"
      />
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
              <ComboBox
                name="IDSOCIEDAD"
                value={comboInputs.IDSOCIEDAD}
                onSelectionChange={(e) => handleComboBoxChange(e, 'IDSOCIEDAD')}
                onInput={(e) => handleComboBoxChange(e, 'IDSOCIEDAD')}
                placeholder="Seleccione Sociedad"
                valueState={errors.IDSOCIEDAD ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.IDSOCIEDAD}</div>}
              >
                {sociedadOptions.map((option) => (
                  <ComboBoxItem key={option.idvalor} text={`${option.valor} (${option.idvalor})`} />
                ))}
              </ComboBox>
            </FormItem>

            <FormItem labelContent={<Label required>IDCEDI</Label>}>
              <ComboBox
                name="IDCEDI"
                value={comboInputs.IDCEDI}
                onSelectionChange={(e) => handleComboBoxChange(e, 'IDCEDI')}
                onInput={(e) => handleComboBoxChange(e, 'IDCEDI')}
                placeholder="Seleccione CEDI"
                valueState={errors.IDCEDI ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.IDCEDI}</div>}
                disabled={!formData.IDSOCIEDAD || formData.IDSOCIEDAD === 0}
              >
                {cediOptions
                  .filter(option => Number(option.idvalorpa) === formData.IDSOCIEDAD || (option.idvalor === '0' && formData.IDSOCIEDAD === 0))
                  .map((option) => (
                    <ComboBoxItem key={option.idvalor} text={`${option.valor} (${option.idvalor})`} />
                  ))}
              </ComboBox>
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
                name="INDICE" // El 'name' es usado por la validación
                value={inputValue}
                placeholder="Escriba y presione Enter o pegue valores separados por comas"
                valueState={errors.INDICE ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.INDICE}</div>}

                tokens={indiceTokens.map((tokenText, index) => (
                  <Token key={index} text={tokenText} />
                ))}

                onInput={(e) => setInputValue(e.target.value)}

                // Lógica para eliminar un token
                onTokenDelete={(e) => {
                  // Comprobar que el array 'tokens' existe y tiene elementos
                  if (!e.detail.tokens || e.detail.tokens.length === 0) return;

                  // Obtener el texto del token eliminado
                  const deletedText = e.detail.tokens[0].text;

                  const newTokens = indiceTokens.filter((t) => t !== deletedText);
                  setIndiceTokens(newTokens);

                  // Actualizar el valor de INDICE en el formData
                  const newIndiceString = newTokens.join(',');

                  // Crear un evento falso para reutilizar handleChange
                  const fakeEvent = { currentTarget: { getAttribute: () => 'INDICE' }, detail: { value: newIndiceString } };
                  handleChange(fakeEvent);
                }}

                // Lógica para añadir tokens al presionar Enter
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

                // Lógica para añadir tokens al quitar el foco
                onBlur={() => {
                  const newText = inputValue.trim();
                  if (newText !== '') { // Si queda texto en el input
                    if (!indiceTokens.includes(newText)) { // Y no es un duplicado
                      const newTokens = [...indiceTokens, newText];
                      setIndiceTokens(newTokens);

                      // Actualizamos el string principal
                      const newIndiceString = newTokens.join(',');
                      const fakeEvent = { currentTarget: { getAttribute: () => 'INDICE' }, detail: { value: newIndiceString } };
                      handleChange(fakeEvent);
                    }
                    setInputValue(''); // Limpiamos el input
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