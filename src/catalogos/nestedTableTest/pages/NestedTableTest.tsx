// src/catalogos/nestedTableTest/pages/NestedTableTest.tsx

import { useState, useEffect } from "react";
import {
  Title,
  Toolbar,
  Input,
  InputDomRef,
  ToolbarSpacer,
  MessageStrip
} from "@ui5/webcomponents-react";
import ModalNewCatalogo from "../../etiquetasValores/components/ModalNewCatalogo";
import ModalNewValor from "../../etiquetasValores/components/ModalNewValor";
import ModalDelete from "../../etiquetasValores/components/ModalDelete";
import ModalSaveChanges from "../../etiquetasValores/components/ModalSaveChanges";
import ModalUpdate from "../../etiquetasValores/components/ModalUpdate";
import { fetchLabels, TableParentRow, TableSubRow } from "../../etiquetasValores/services/labelService";
import { setLabels, getLabels, subscribe, addOperation } from "../../etiquetasValores/store/labelStore";
import NestedTable from "../components/NestedTable";

export default function NestedTableTest() {
  const [saveMessage, setSaveMessage] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<TableParentRow[]>([]);
  const [labels, setLocalLabels] = useState<TableParentRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSmall, setIsSmall] = useState(false);
  // FIC: Cambiado a array para soportar selección múltiple de valores
  const [selectedValores, setSelectedValores] = useState<TableSubRow[]>([]);
  const [selectedValorParent, setSelectedValorParent] = useState<TableParentRow | null>(null);


  useEffect(() => {
    fetchLabels().then((transformedData) => {
      setLabels(transformedData);
      setLocalLabels(transformedData);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setLocalLabels(getLabels());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 970px)');
    const onChange = (e: MediaQueryListEvent) => setIsSmall(e.matches);
    setIsSmall(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const handleSave = () => {
    setSaveMessage("Datos guardados correctamente.");
    fetchLabels().then((transformedData) => {
      setLabels(transformedData.map(item => ({ ...item, isSelected: false })));
      setLocalLabels(transformedData.map(item => ({ ...item, isSelected: false })));
    });
    setTimeout(() => {
      setSaveMessage("");
    }, 3000);
  };

  // Handler para marcar la etiqueta como eliminada
  const handleDeleteConfirmLabel = () => {
    selectedLabels.forEach(label => {
      addOperation({
        collection: 'labels',
        action: 'DELETE',
        payload: {
          id: label.idetiqueta,
        }
      });
    });
    // Limpiar la selección actual
    setSelectedLabels([]);
  };

  const handleDeleteConfirmValor = () => {
    if (!selectedValorParent) return;

    selectedValores.forEach(valor => {
      addOperation({
        collection: 'values',
        action: 'DELETE',
        payload: {
          id: valor.idvalor,
          IDETIQUETA: selectedValorParent.idetiqueta,
        }
      });
    });
    setSelectedValores([]);
    setSelectedValorParent(null);
  };

  const filteredLabels = labels.filter((label) => {
    const term = searchTerm.toLowerCase();
    return (
      label.etiqueta?.toLowerCase().includes(term) ||
      label.descripcion?.toLowerCase().includes(term) ||
      label.coleccion?.toLowerCase().includes(term) ||
      label.seccion?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <Title level="H1" size="H2" style={{ marginBottom: "1rem" }}>
        Catálogos y Valores - Prueba de Tablas Anidadas
      </Title>
      <Toolbar
        style={{
          padding: "0.5rem",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <ModalNewCatalogo compact={isSmall} />
        <ModalNewValor compact={isSmall} />

        {/* Botones de Eliminar habilitados si hay al menos una selección */}
      <ModalDelete
          compact={isSmall}
          selectedLabels={selectedLabels}
          selectedValores={selectedValores}
          selectedValorParent={selectedValorParent}
          onDeleteConfirmCatalogo={handleDeleteConfirmLabel}
          onDeleteConfirmValor={handleDeleteConfirmValor}
      />

        {/* Botones de Actualizar habilitados SOLO si hay EXACTAMENTE una selección */}
      <ModalUpdate
          compact={isSmall}
          selectedLabels={selectedLabels}
          selectedValores={selectedValores}
          selectedValorParent={selectedValorParent}
      />
        <ToolbarSpacer />
        <ModalSaveChanges onSave={handleSave} compact={isSmall} />
      </Toolbar>

      <Input
        placeholder="Buscar etiqueta, colección o descripción..."
        showClearIcon
        onInput={(e) =>
          setSearchTerm((e.target as unknown as InputDomRef).value)
        }
        style={{
          marginBottom: "1rem",
          width: "100%",
          maxWidth: "500px",
        }}
      />
      {saveMessage && (
        <MessageStrip design="Positive" style={{ marginBottom: "1rem" }}>
          {saveMessage}
        </MessageStrip>
      )}
      <NestedTable
        data={filteredLabels}
        onSelectionChange={setSelectedLabels}
        onValorSelectionChange={(valores, parent) => {
          // Ahora recibimos un array de valores
          setSelectedValores(valores || []);
          setSelectedValorParent(parent);
        }}
      />
    </div>
  );
}
