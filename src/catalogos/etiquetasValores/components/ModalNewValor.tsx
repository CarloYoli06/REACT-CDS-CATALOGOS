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
  ComboBox,
  ComboBoxItem,
} from "@ui5/webcomponents-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { addOperation, getLabels, subscribe } from "../store/labelStore";
import { TableParentRow, TableSubRow } from "../services/labelService";
import { ValueHelpSelector, LabelData } from "./ValueHelpSelector";
import ValidationErrorDialog from './ValidationErrorDialog';

const initialFormState = {
  IDVALOR: "",
  VALOR: "",
  IDVALORPA: "",
  ALIAS: "",
  SECUENCIA: 0,
  DESCRIPCION: "",
  IMAGEN: "",
  ROUTE: "",
  IDSOCIEDAD: "0",
  IDCEDI: "0",
};

interface ModalNewValorProps {
  compact?: boolean;
  preSelectedParent?: TableParentRow | null;
}

function ModalNewValor({compact = false, preSelectedParent }: ModalNewValorProps) { // <--- Desestructuramos el prop
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<any>({});
  const latestFormRef = useRef(initialFormState);

  const [parentLabels, setParentLabels] = useState<TableParentRow[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  const [selectedIdValorPa, setSelectedIdValorPa] = useState<string | null>(null);

  // Estados para ComboBox
  const [sociedadOptions, setSociedadOptions] = useState<TableSubRow[]>([]);
  const [cediOptions, setCediOptions] = useState<TableSubRow[]>([]);
  const [comboInputs, setComboInputs] = useState({ idsociedad: '', idcedi: '' });

  const [showErrorDialog, setShowErrorDialog] = useState(false);

  useEffect(() => {
    const loadData = () => {
        const allLabels = getLabels();
        const parents = allLabels.filter((label) => label.parent);
        setParentLabels(parents);

        const sociedadLabel = allLabels.find(l => l.etiqueta === 'SOCIEDAD');
        const cediLabel = allLabels.find(l => l.etiqueta === 'Catálogo de Centros de Distribución');

        setSociedadOptions(sociedadLabel?.subRows || []);
        setCediOptions(cediLabel?.subRows || []);
    };

    loadData();

    const unsubscribe = subscribe(() => {
      loadData();
    });

    return () => unsubscribe();
  }, []);

  // Transformar parentLabels a formato LabelData para el ValueHelpSelector
  // Esto agrupa los valores de cada etiqueta padre
  const valueHelpData = useMemo<LabelData[]>(() => {
    return parentLabels.map((label) => ({
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
      // Mapear los subRows (valores) de cada etiqueta
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
  }, [parentLabels]);

  const validate = (data: typeof initialFormState, parentId: string | null) => {
    const newErrors: any = {};

    if (!parentId) newErrors.parent = "Debe seleccionar una Etiqueta padre.";

    if (!data.IDVALOR) {
      newErrors.IDVALOR = "IDVALOR es requerido.";
    } else {
      const allLabels = getLabels();
      let exists = false;
      for (const label of allLabels) {
        if (label.subRows) {
          const match = label.subRows.find(v => v.idvalor === data.IDVALOR);
          if (match) {
            exists = true;
            break;
          }
        }
      }
      if (exists) {
        newErrors.IDVALOR = `El ID "${data.IDVALOR}" ya existe.`;
      }
    }

    if (!data.VALOR) newErrors.VALOR = "VALOR es requerido.";

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log("Validation result:", isValid, "Errors:", newErrors);
    return isValid;
  };

  const handleChange = (e: any) => {
    const current = e.currentTarget;
    const target = e.target;

    const name =
      (current &&
        (current.name ||
          (current.getAttribute && current.getAttribute("name")))) ||
      (target &&
        (target.name ||
          (target.getAttribute && target.getAttribute("name")))) ||
      "";

    const value =
      e && e.detail && e.detail.value !== undefined
        ? e.detail.value
        : (target &&
          (target.value !== undefined
            ? target.value
            : target.getAttribute && target.getAttribute("value"))) ||
        "";

    if (!name) {
      console.warn('handleChange no pudo determinar el "name" del campo.');
      return;
    }

    setFormData((prevState) => {
      const converted = name === "SECUENCIA" ? Number(value) || 0 : value;

      const updatedState = {
        ...prevState,
        [name]: converted,
      };

      latestFormRef.current = updatedState;
      return updatedState;
    });
  };

  const handleParentChange = (e: any) => {
    if (!e.detail.item) {
      setSelectedParentId(null);
      return;
    }

    const selectedId = e.detail.item.dataset.id;
    setSelectedParentId(selectedId);

    // Update IDSOCIEDAD and IDCEDI based on parent
    const parent = parentLabels.find(l => l.idetiqueta === selectedId);
    if (parent) {
        const initialSociedadText = sociedadOptions.find(o => o.idvalor === parent.idsociedad || o.valor === parent.idsociedad)?.valor || parent.idsociedad || '';
        const initialCediText = cediOptions.find(o => o.idvalor === parent.idcedi || o.valor === parent.idcedi)?.valor || parent.idcedi || '';

        setComboInputs({
            idsociedad: initialSociedadText,
            idcedi: initialCediText
        });

        setFormData(prev => {
            const updated = {
                ...prev,
                IDSOCIEDAD: parent.idsociedad,
                IDCEDI: parent.idcedi
            };
            latestFormRef.current = updated;
            return updated;
        });
    }

    // Limpiar el IDVALORPA cuando se cambia la etiqueta padre
    setSelectedIdValorPa(null);
  };

  const handleComboBoxChange = (e: any, fieldName: 'IDSOCIEDAD' | 'IDCEDI') => {
      const selectedItem = e.detail.item;
      const inputValue = e.target.value;

      let newId = '0';
      let newText = inputValue;

      const options = fieldName === 'IDSOCIEDAD' ? sociedadOptions : cediOptions;

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

      if (fieldName === 'IDSOCIEDAD') {
          const cediDefaultText = cediOptions.find(o => o.idvalor === '0')?.valor || 'Todos los CEDIs';
          
          setComboInputs({
              idsociedad: newText,
              idcedi: cediDefaultText  // ← Reset visual
          });

          setFormData(prevState => {
              const updatedState = {
                  ...prevState,
                  IDSOCIEDAD: newId,
                  IDCEDI: '0'  // ← Reset a "0"
              };
              latestFormRef.current = updatedState;
              return updatedState;
          });
      } else {
          // Solo cambió CEDI
          setComboInputs(prev => ({
              ...prev,
              idcedi: newText
          }));

          setFormData(prevState => {
              const updatedState = {
                  ...prevState,
                  IDCEDI: newId
              };
              latestFormRef.current = updatedState;
              return updatedState;
          });
      }
  };

  const handleIdValorPaSelect = (idvalor: string | null) => {
    setSelectedIdValorPa(idvalor);

    // Actualizar el formData con el IDVALORPA seleccionado
    setFormData((prevState) => {
      const updatedState = {
        ...prevState,
        IDVALORPA: idvalor || "",
      };
      latestFormRef.current = updatedState;
      return updatedState;
    });
  };

  const handleSubmit = async () => {
    console.log("handleSubmit (Valor) called");
    const snapshot = { ...(latestFormRef.current || formData) };

    if (validate(snapshot, selectedParentId)) {
      try {
        const parentLabel = parentLabels.find(
          (l) => l.idetiqueta === selectedParentId
        );
        if (!parentLabel) {
          console.error("Error: No se encontró el padre seleccionado.");
          setErrors({
            ...errors,
            parent: "Error al encontrar el padre. Intente de nuevo.",
          });
          return;
        }

        console.log("Validation passed. Building local object...");

        const fullValorObject = {
          ...snapshot,
          IDSOCIEDAD: Number(snapshot.IDSOCIEDAD) || Number(parentLabel.idsociedad),
          IDCEDI: Number(snapshot.IDCEDI) || Number(parentLabel.idcedi),
          IDETIQUETA: parentLabel.idetiqueta,
          SECUENCIA: Number(snapshot.SECUENCIA) || 0,
        };

        addOperation({
          collection: "values",
          action: "CREATE",
          payload: fullValorObject,
        });

        console.log("Local object passed to store. Closing modal.");
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error calling addOperation for Valor:", error);
      }
    } else {
      console.log("Validation failed. Errors:", errors);
      setShowErrorDialog(true);
    }
  };

  const selectedParentData = parentLabels.find(
    (l) => l.idetiqueta === selectedParentId
  );

  const openModal = () => {
    setFormData(initialFormState);
    latestFormRef.current = initialFormState;

    // AQUÍ ESTÁ LA LÓGICA DE PRESELECCIÓN:
    // Si nos pasaron un padre preseleccionado, usamos su ID.
    // Si no, lo dejamos en null (como estaba antes).
    if (preSelectedParent) {
      setSelectedParentId(preSelectedParent.idetiqueta);
      // Populate sociedad/cedi from preSelectedParent
      const initialSociedadText = sociedadOptions.find(o => o.idvalor === preSelectedParent.idsociedad || o.valor === preSelectedParent.idsociedad)?.valor || preSelectedParent.idsociedad || '';
      const initialCediText = cediOptions.find(o => o.idvalor === preSelectedParent.idcedi || o.valor === preSelectedParent.idcedi)?.valor || preSelectedParent.idcedi || '';
      
      setComboInputs({
          idsociedad: initialSociedadText,
          idcedi: initialCediText
      });
      setFormData(prev => {
          const updated = { ...prev, IDSOCIEDAD: preSelectedParent.idsociedad, IDCEDI: preSelectedParent.idcedi };
          latestFormRef.current = updated;
          return updated;
      });

    } else {
      setSelectedParentId(null);
      setComboInputs({ idsociedad: '', idcedi: '' });
    }

    setSelectedIdValorPa(null);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button design="Emphasized" icon="add" onClick={openModal} accessibleName="Crear Nuevo Valor" disabled={!preSelectedParent}>
        {!compact && 'Crear Nuevo Valor'}
      </Button>
      <ValidationErrorDialog
        open={showErrorDialog}
        errors={errors}
        onClose={() => setShowErrorDialog(false)}
        title="Errores al Crear Valor"
      />
      <Dialog
        open={isModalOpen}
        headerText="Agrega un Valor"
        style={{ width: "700px" }}
        footer={
          <FlexBox
            justifyContent={FlexBoxJustifyContent.End}
            fitContainer
            style={{ paddingBlock: "0.25rem" }}
          >
            <Button onClick={handleSubmit}>Crear </Button>
            <Button onClick={handleClose}>Cerrar</Button>{" "}
          </FlexBox>
        }
      >
        <Form>
          <FormGroup headerText="Información del Catálogo">
            <FormItem labelContent={<Label required>Etiqueta Padre</Label>}>
              <ComboBox
                onSelectionChange={handleParentChange}
                value={selectedParentData?.etiqueta || ""}
              >
                {parentLabels.map((label) => (
                  <ComboBoxItem
                    key={label.idetiqueta}
                    text={label.etiqueta}
                    data-id={label.idetiqueta}
                  />
                ))}
              </ComboBox>
              {errors.parent && (
                <span style={{ color: "red" }}>{errors.parent}</span>
              )}
            </FormItem>

            <FormItem labelContent={<Label>ID Sociedad (Padre)</Label>}>
              <Input value={selectedParentData?.idsociedad || ""} disabled />
            </FormItem>
            <FormItem labelContent={<Label>ID Cedi (Padre)</Label>}>
              <Input value={selectedParentData?.idcedi || ""} disabled />
            </FormItem>
            <FormItem labelContent={<Label>ID Etiqueta (Padre)</Label>}>
              <Input value={selectedParentData?.idetiqueta || ""} disabled />
            </FormItem>
          </FormGroup>

          <FormGroup headerText="Información del Valor">
            <FormItem labelContent={<Label required>ID del Valor</Label>}>
              <Input
                name="IDVALOR"
                value={formData.IDVALOR}
                onInput={handleChange}
                valueState={errors.IDVALOR ? "Negative" : "None"}
                valueStateMessage={<div slot="valueStateMessage">{errors.IDVALOR}</div>}
              />
            </FormItem>

            <FormItem labelContent={<Label>IDSOCIEDAD</Label>}>
                <ComboBox
                    name="IDSOCIEDAD"
                    value={comboInputs.idsociedad}
                    onSelectionChange={(e) => handleComboBoxChange(e, 'IDSOCIEDAD')}
                    onInput={(e) => handleComboBoxChange(e, 'IDSOCIEDAD')}
                    placeholder="Seleccione Sociedad"
                >
                    {sociedadOptions.map((option) => (
                        <ComboBoxItem key={option.idvalor} text={option.valor} />
                    ))}
                </ComboBox>
            </FormItem>

            <FormItem labelContent={<Label>IDCEDI</Label>}>
                <ComboBox
                    name="IDCEDI"
                    value={comboInputs.idcedi}
                    onSelectionChange={(e) => handleComboBoxChange(e, 'IDCEDI')}
                    onInput={(e) => handleComboBoxChange(e, 'IDCEDI')}
                    placeholder="Seleccione CEDI"
                    disabled={!formData.IDSOCIEDAD || formData.IDSOCIEDAD === '0'}
                >
                    {cediOptions
                        .filter(option => Number(option.idvalorpa) === Number(formData.IDSOCIEDAD))
                        .map((option) => (
                            <ComboBoxItem key={option.idvalor} text={option.valor} />
                        ))}
                </ComboBox>
            </FormItem>

            <FormItem labelContent={<Label required>Valor</Label>}>
              <Input
                name="VALOR"
                value={formData.VALOR}
                onInput={handleChange}
              />
              {errors.VALOR && (
                <span style={{ color: "red" }}>{errors.VALOR}</span>
              )}
            </FormItem>

            <FormItem labelContent={<Label>ID Valor Padre (IDVALORPA)</Label>}>
              <ValueHelpSelector

                placeholder="Buscar o seleccionar valor padre..."
                data={valueHelpData}
                value={selectedIdValorPa}
                onSelect={handleIdValorPaSelect}
              />
            </FormItem>

            <FormItem labelContent={<Label>Alias</Label>}>
              <Input
                name="ALIAS"
                value={formData.ALIAS}
                onInput={handleChange}
              />
            </FormItem>

            <FormItem labelContent={<Label>Secuencia</Label>}>
              <Input
                name="SECUENCIA"
                type="Number"
                value={formData.SECUENCIA.toString()}
                onInput={handleChange}
              />
            </FormItem>

            <FormItem labelContent={<Label>Imagen</Label>}>
              <Input
                name="IMAGEN"
                value={formData.IMAGEN}
                onInput={handleChange}
              />
            </FormItem>

            <FormItem labelContent={<Label>Ruta</Label>}>
              <Input
                name="ROUTE"
                value={formData.ROUTE}
                onInput={handleChange}
              />
            </FormItem>

            <FormItem labelContent={<Label>Descripción</Label>}>
              <Input
                name="DESCRIPCION"
                value={formData.DESCRIPCION}
                onInput={handleChange}
              />
            </FormItem>
          </FormGroup>
        </Form>
      </Dialog>
    </>
  );
}

export default ModalNewValor;