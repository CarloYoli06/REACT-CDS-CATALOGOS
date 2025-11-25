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
import ModalDeleteCatalogo from "../components/ModalDeleteCatalogo";
import ModalDeleteValor from "../components/ModalDeleteValor";
import ModalSaveChanges from "../components/ModalSaveChanges";
import ModalUpdateCatalogo from "../components/ModalUpdateCatalogo";
import ModalUpdateValor from "../components/ModalUpdateValor";
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
    const unsub = subscribe(() => setLocalLabels(getLabels()));
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
        payload: { id: label.idetiqueta }
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

    const childrenMatch = label.subRows?.some(v =>
      (v.valor?.toLowerCase().includes(term) ||
       v.descripcion?.toLowerCase().includes(term) ||
       v.alias?.toLowerCase().includes(term))
    );

    // ⭐⭐ CLAVE: si coincide o padre o hijo, regresamos el padre **COMPLETO**
    if (parentMatch || childrenMatch) {
      return {
        ...label,
        // ⭐ NO filtramos los hijos, se regresan tal cual
        subRows: label.subRows
      };
    }

    return null;
  })
  .filter(Boolean);

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
      <ModalDeleteCatalogo
        label={selectedLabels.length > 0 ? selectedLabels[0] : null}
        compact={false}
        onDeleteConfirm={handleDeleteConfirmLabel}
      />
      <ModalDeleteValor
        compact={false}
        valor={selectedValores.length > 0 ? selectedValores[0] : null}
        parentLabel={selectedValorParent}
        onDeleteConfirm={handleDeleteConfirmValor}
      />
      <ModalUpdateCatalogo
        label={selectedLabels.length === 1 ? selectedLabels[0] : null}
        compact={false}
      />
      <ModalUpdateValor
        compact={false}
        valorToEdit={selectedValores.length === 1 ? selectedValores[0] : null}
        parentLabel={selectedValorParent}
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
            <ModalDeleteCatalogo
              label={selectedLabels.length > 0 ? selectedLabels[0] : null}
              compact={isSmall}
              onDeleteConfirm={handleDeleteConfirmLabel}
            />
            <ModalDeleteValor
              compact={isSmall}
              valor={selectedValores.length > 0 ? selectedValores[0] : null}
              parentLabel={selectedValorParent}
              onDeleteConfirm={handleDeleteConfirmValor}
            />
            <ModalUpdateCatalogo
              label={selectedLabels.length === 1 ? selectedLabels[0] : null}
              compact={isSmall}
            />
            <ModalUpdateValor
              compact={isSmall}
              valorToEdit={selectedValores.length === 1 ? selectedValores[0] : null}
              parentLabel={selectedValorParent}
            />
          </div>
        )}

        <ToolbarSpacer />

        <ModalSaveChanges
          compact={isSmall}
          onSave={handleSave}
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
