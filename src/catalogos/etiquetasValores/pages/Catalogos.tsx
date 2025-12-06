// src/catalogos/etiquetasValores/pages/Catalogos.tsx
import { useState, useEffect, useMemo } from "react";
import {
  Title,
  Toolbar,
  ToolbarSpacer,
  Input,
  InputDomRef,
  MessageStrip,
  Button,
  Popover
} from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/menu2";

import ModalNewCatalogo from "../components/ModalNewCatalogo";
import ModalNewValor from "../components/ModalNewValor";
import ModalDelete from "../components/ModalDelete";
import ModalSaveChanges from "../components/ModalSaveChanges";
import ModalUpdate from "../components/ModalUpdate";
import ValidationErrorDialog from "../components/ValidationErrorDialog";

import {
  fetchLabels,
  saveChanges,
  TableParentRow,
  TableSubRow
} from "../services/labelService";

import { getLabels, subscribe, addOperation } from "../store/labelStore";
import TableLabels from "../components/TableLabels";

export default function Catalogos() {
  const [saveMessage, setSaveMessage] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<TableParentRow[]>([]);
  const [labels, setLocalLabels] = useState<TableParentRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isSmall, setIsSmall] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [selectedValores, setSelectedValores] = useState<TableSubRow[]>([]);
  const [selectedValorParent, setSelectedValorParent] = useState<TableParentRow | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tableRefreshKey, setTableRefreshKey] = useState(0);

  // *** Estados para manejo de errores del backend ***
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errors, setErrors] = useState<any>([]);
  const [isSaving, setIsSaving] = useState(false);


  // cargar etiquetas
  useEffect(() => {
    fetchLabels();
  }, []);

  // suscribir al store
  useEffect(() => {
    setLocalLabels(getLabels());
    const unsub = subscribe(() => {
      const currentLabels = getLabels();
      setLocalLabels(currentLabels);

      // Refresh selectedLabels
      setSelectedLabels(prevSelected => {
        if (prevSelected.length === 0) return [];
        return prevSelected.map(prev => {
          const found = currentLabels.find(l => l.internalId === prev.internalId);
          return found || prev;
        });
      });

      // Refresh selectedValores
      setSelectedValores(prevSelected => {
        if (prevSelected.length === 0) return [];
        // Need to find the parent first to find the value
        // Assuming selectedValores belong to selectedValorParent
        // We need to refresh selectedValorParent first? 
        // Actually, selectedValores are just subRows. We can search in all labels.
        
        // Optimization: if we have selectedValorParent, search there first.
        return prevSelected.map(prev => {
           let foundVal: TableSubRow | undefined;
           for (const label of currentLabels) {
               if (label.subRows) {
                   foundVal = label.subRows.find(v => v.internalId === prev.internalId);
                   if (foundVal) break;
               }
           }
           return foundVal || prev;
        });
      });
      
      // Refresh selectedValorParent
      setSelectedValorParent(prev => {
          if (!prev) return null;
          return currentLabels.find(l => l.internalId === prev.internalId) || prev;
      });

    });
    return () => unsub();
  }, []);

  // responsive
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsSmall(width <= 1315);
      setIsMobile(width <= 970);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // *** AQUÍ SE HACE TODO EL GUARDADO ***
  const handleSave = async () => {
    setIsSaving(true);

    const result = await saveChanges();
    setIsSaving(false);

    if (!result.success) {
      setErrors(
        result.errors ||
        [{
          status: "ERROR",
          operation: "BATCH",
          collection: "multiple",
          id: "batch",
          error: {
            code: "OPERATION_FAILED",
            message: result.message || "Error al guardar cambios"
          }
        }]
      );

      setShowErrorDialog(true);
      return;
    }

    // Éxito
    setSaveMessage("Datos guardados correctamente.");
    await fetchLabels();

    setSelectedLabels([]);
    setSelectedValores([]);
    setSelectedValorParent(null);

    setTableRefreshKey((p) => p + 1);

    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleDeleteConfirmLabel = () => {
    selectedLabels.forEach(label => {
      addOperation({
        collection: "labels",
        action: "DELETE",
        payload: { id: label.idetiqueta, internalId: label.internalId }
      });
    });
    setSelectedLabels([]);
  };

  const handleDeleteConfirmValor = () => {
    if (!selectedValorParent) return;

    selectedValores.forEach(valor => {
      addOperation({
        collection: "values",
        action: "DELETE",
        payload: {
          id: valor.idvalor,
          internalId: valor.internalId,
          IDETIQUETA: selectedValorParent.idetiqueta
        }
      });
    });

    setSelectedValores([]);
    setSelectedValorParent(null);
  };

const filteredLabels = labels
  .map(label => {
    const term = searchTerm.toLowerCase();

    const parentMatch =
      label.etiqueta?.toLowerCase().includes(term) ||
      label.descripcion?.toLowerCase().includes(term) ||
      label.coleccion?.toLowerCase().includes(term) ||
      label.seccion?.toLowerCase().includes(term);

    // Filtrar solo los hijos que coinciden con la búsqueda
    const matchedChildren = label.subRows?.filter(v =>
      v.valor?.toLowerCase().includes(term) ||
      v.descripcion?.toLowerCase().includes(term) ||
      v.alias?.toLowerCase().includes(term)
    ) || [];

    const childrenMatch = matchedChildren.length > 0;

    // Si coincide el padre o algún hijo
    if (parentMatch || childrenMatch) {
      return {
        ...label,
        subRows: parentMatch ? label.subRows : matchedChildren
      };
    }

    return null;
  })
  .filter((row): row is TableParentRow => row !== null);

  const preparedData = useMemo(() => {
    return filteredLabels.map(row => {
      const id = `parent-${row.idetiqueta}`;
      return { ...row, isExpanded: !!expandedRows[id] };
    });
  }, [filteredLabels, expandedRows]);

  const handleExpandChange = (changedExpanded: Record<string, boolean>) => {
    setExpandedRows(prev => ({ ...prev, ...changedExpanded }));
  };

  const mobileMenuContent = (
    <>
      <ModalNewCatalogo compact={false} />
      <ModalNewValor
        compact={false}
        preSelectedParent={selectedLabels.length === 1 ? selectedLabels[0] : null}
      />
      <ModalDelete
        compact={isSmall}
        selectedLabels={selectedLabels}
        selectedValores={selectedValores}
        selectedValorParent={selectedValorParent}
        onDeleteConfirmCatalogo={handleDeleteConfirmLabel}
        onDeleteConfirmValor={handleDeleteConfirmValor}
      />
      <ModalUpdate
        compact={isSmall}
        selectedLabels={selectedLabels}
        selectedValores={selectedValores}
        selectedValorParent={selectedValorParent}
      />
    </>
  );

  const headerContent = (
    <>
      <Toolbar
        key={isMobile ? "mobile-toolbar" : "desktop-toolbar"}
        style={{ padding: "0.5rem", gap: "0.5rem", marginBottom: "1rem" }}
      >
        {isMobile ? (
          <Button
            id="menu-settings-btn"
            icon="menu2"
            design="Transparent"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
        ) : (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <ModalNewCatalogo compact={isSmall} />
            <ModalNewValor
              compact={isSmall}
              preSelectedParent={selectedLabels.length === 1 ? selectedLabels[0] : null}
            />
            <ModalDelete
              compact={isSmall}
              selectedLabels={selectedLabels}
              selectedValores={selectedValores}
              selectedValorParent={selectedValorParent}
              onDeleteConfirmCatalogo={handleDeleteConfirmLabel}
              onDeleteConfirmValor={handleDeleteConfirmValor}
            />
            <ModalUpdate
              compact={isSmall}
              selectedLabels={selectedLabels}
              selectedValores={selectedValores}
              selectedValorParent={selectedValorParent}
            />
          </div>
        )}

        <ToolbarSpacer />

        <ModalSaveChanges
          compact={isSmall}
          onSave={handleSave}
          busy={isSaving}
        />
      </Toolbar>

      {isMobile && (
        <Popover
          opener="menu-settings-btn"
          open={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          placement="Bottom"
          headerText="Gestión"
        >
          <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "1rem",
            gap: "0.5rem"
          }}>
            {mobileMenuContent}

            <Button
              design="Transparent"
              onClick={() => setIsMenuOpen(false)}
            >
              Cerrar menú
            </Button>
          </div>
        </Popover>
      )}

      <Input
        placeholder="Buscar etiqueta, colección o descripción..."
        showClearIcon
        onInput={(e) => setSearchTerm((e.target as InputDomRef).value)}
        style={{ marginBottom: "1rem", maxWidth: "500px", width: "100%" }}
      />

      {saveMessage && (
        <MessageStrip design="Positive" style={{ marginBottom: "1rem" }}>
          {saveMessage}
        </MessageStrip>
      )}
    </>
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1rem 1rem 0 1rem" }}>
        <Title level="H1" size="H2">Catálogos y Valores</Title>
      </div>

      <ValidationErrorDialog
        open={showErrorDialog}
        errors={errors}
        onClose={() => setShowErrorDialog(false)}
        title="Errores al Guardar Cambios"
      />

      <div style={{ flex: 1, overflow: "hidden", padding: "0 1rem 1rem" }}>
        <TableLabels
          key={tableRefreshKey}
          data={preparedData}
          initialExpanded={expandedRows}
          onExpandChange={handleExpandChange}
          onSelectionChange={setSelectedLabels}
          onValorSelectionChange={(vals, parent) => {
            setSelectedValores(vals || []);
            setSelectedValorParent(parent);
          }}
          headerContent={headerContent}
        />
      </div>
    </div>
  );
}
