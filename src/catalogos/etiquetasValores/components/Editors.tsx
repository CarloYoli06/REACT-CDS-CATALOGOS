import React, { useState, useEffect, useMemo } from "react";
import {
  Input,
  MultiInput,
  Token,
} from "@ui5/webcomponents-react";
import '@ui5/webcomponents-icons/dist/value-help';
import '@ui5/webcomponents-icons/dist/decline';
import { getLabels } from "../store/labelStore";
import { ValueHelpSelector, LabelData } from "./ValueHelpSelector"; 

interface EditorProps {
  value: any;
  onSave: (newValue: any) => void;
  onCancel: () => void;
  onTab?: (e: React.KeyboardEvent, currentValue: any) => void;
  rowOriginal?: any;
}

// --- EDITOR DE INDICE ---
export const IndiceEditor = ({ value, onSave, onCancel, onTab }: EditorProps) => {
  const [tokens, setTokens] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (typeof value === 'string' && value.trim() !== '') {
      setTokens(value.split(',').filter(t => t.trim() !== ''));
    } else {
      setTokens([]);
    }
  }, [value]);

  const commitChanges = () => {
    let finalTokens = [...tokens];
    if (inputValue.trim() !== "" && !tokens.includes(inputValue.trim())) {
      finalTokens.push(inputValue.trim());
    }
    onSave(finalTokens.join(', '));
  };

  const handleTokenDelete = (e: any) => {
    if (e) {
      e.stopPropagation?.();
      e.preventDefault?.();
    }

    const deletedText = e.detail?.tokens?.[0]?.text;
    if (deletedText) {
      setTokens(prev => prev.filter(t => t !== deletedText));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.stopPropagation();
      return;
    }

    if (e.key === "Enter") {
      e.stopPropagation();
      e.preventDefault();
      if (inputValue.trim()) {
        if(!tokens.includes(inputValue.trim())){
          setTokens([...tokens, inputValue.trim()]);
        }
        setInputValue("");
      } else {
        commitChanges();
      }
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      onCancel();
    }
    if (e.key === "Tab") {
      if (onTab) {
        e.preventDefault(); 
        e.stopPropagation();

        let finalTokens = [...tokens];
        const textPending = inputValue.trim();
            
        if (textPending !== "" && !tokens.includes(textPending)) {
          finalTokens.push(textPending);
        }
            
        onTab(e, finalTokens.join(','));
      }
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ width: "100%" }}>
      <MultiInput
        value={inputValue}
        onInput={(e) => setInputValue(e.target.value)}
        tokens={tokens.map((t, i) => <Token key={i} text={t} />)}
        onTokenDelete={handleTokenDelete}
        onKeyDown={handleKeyDown}
        onBlur={commitChanges}
        style={{ width: "100%" }}
        showValueHelpIcon={false}
      />
    </div>
  );
};

interface CatalogEditorProps extends EditorProps {
  catalogTag: "SOCIEDAD" | "CEDI";
}

export const CatalogEditor = ({ value, onSave, onCancel, onTab, catalogTag, rowOriginal }: CatalogEditorProps) => {
  // 1. Calculamos las opciones filtradas (Cascada + Opción 0)
  const filteredData = useMemo<LabelData[]>(() => {
    const allLabels = getLabels();
    
    // Buscar catálogo padre
    const tagToSearch = catalogTag === "SOCIEDAD" ? "SOCIEDAD" : "CEDI";
    let catalogSource = allLabels.find(l => l.idetiqueta === tagToSearch);
    
    if (!catalogSource) {
      catalogSource = allLabels.find(l => l.etiqueta === (catalogTag === "SOCIEDAD" ? "SOCIEDAD" : "Catálogo de Centros de Distribución"));
    }

    let rawOptions = catalogSource && catalogSource.subRows ? [...catalogSource.subRows] : [];

    // Lógica de Cascada (Filtrar CEDIs por Sociedad)
    if (catalogTag === "CEDI" && rowOriginal) {
      const currentSociedadId = Number(rowOriginal.idsociedad);
      if (currentSociedadId && currentSociedadId !== 0) {
        rawOptions = rawOptions.filter(opt => Number(opt.idvalorpa) === currentSociedadId);
      }
    }

    // Opción "Todos" (0)
    const defaultLabel = catalogTag === "SOCIEDAD" ? "Todas las Sociedades" : "Todos los CEDIs";
    const optionZero: any = {
      idvalor: "0",
      valor: defaultLabel,
      idsociedad: "0", idcedi: "0", idetiqueta: "", idvalorpa: null, alias: "", secuencia: 0, imagen: null, ruta: null, descripcion: "", indice: "", coleccion: "", seccion: ""
    };

    // Empaquetamos como LabelData[] para el ValueHelpSelector
    // Creamos un "Grupo" ficticio con el nombre del catálogo
    return [{
        parent: true,
        idetiqueta: tagToSearch,
        etiqueta: catalogTag === "SOCIEDAD" ? "Sociedades Disponibles" : "CEDIs Disponibles",
        idsociedad: "", idcedi: "", indice: "", coleccion: "", seccion: "", secuencia: 0, imagen: "", ruta: "", descripcion: "",
        subRows: [optionZero, ...rawOptions]
    }];

  }, [catalogTag, rowOriginal]); // Se recalcula si cambia el tag o la fila (cascada)

  // 2. Handlers (Reutilizando la lógica simple de ParentValueEditor)
  const handleSelect = (selectedValue: string | null) => {
    if (selectedValue !== undefined) {
      onSave(selectedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
    if (e.key === "Tab") {
      if (onTab) {
        e.preventDefault(); 
        e.stopPropagation();
        onTab(e, value); 
      }
    }
  };

  return (
    <div 
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      style={{ width: '100%' }}
    >
      <ValueHelpSelector
        data={filteredData} 
        value={value}
        onSelect={handleSelect}
        placeholder={catalogTag === "SOCIEDAD" ? "Seleccionar Sociedad..." : "Seleccionar CEDI..."}
      />
    </div>
  );
};

// --- EDITOR DE VALOR PADRE ---
export const ParentValueEditor = ({ value, onSave, onCancel, onTab }: EditorProps) => {
  const allData = useMemo(() => getLabels(), []);

  const handleSelect = (selectedValue: string | null) => {
    if (selectedValue !== undefined) {
      onSave(selectedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
    if (e.key === "Tab") {
      if (onTab) {
        e.preventDefault(); 
        e.stopPropagation();
        onTab(e, value); 
      }
    }
  };

  return (
    <div 
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      style={{ width: '100%' }}
    >
      <ValueHelpSelector
        data={allData} 
        value={value}
        onSelect={handleSelect}
        placeholder="Seleccionar Padre..."
      />
    </div>
  );
};

// --- EDITOR NUMÉRICO ---
export const NumericEditor = ({ value, onSave, onCancel, onTab }: EditorProps) => {
  const [inputValue, setInputValue] = useState(value !== undefined && value !== null ? String(value) : "");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.stopPropagation();
      return;
    }

    if (e.key === "Enter") {
      onSave(inputValue);
    }
    
    if (e.key === "Escape") {
      e.stopPropagation();
      onCancel();
    }
    if (e.key === "Tab") {
      if (onTab) {
        e.preventDefault(); 
        e.stopPropagation();
        onTab(e, inputValue); 
      }
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ width: "100%" }}>
      <Input
        type="Number"
        value={inputValue}
        onInput={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(inputValue)}
        style={{ width: "100%" }}
      />
    </div>
  );
};

interface UniqueIdEditorProps extends EditorProps {
  idType: 'label' | 'value';
  currentId: string;
  parentId?: string; 
}

export const UniqueIdEditor = ({ value, onSave, onCancel, onTab, idType, currentId }: UniqueIdEditorProps) => {
  const [inputValue, setInputValue] = useState(value?.toString() || "");
  const [errorState, setErrorState] = useState<"None" | "Negative">("None"); 
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const val = inputValue.trim();
      
    if (!val) {
      setErrorState("None"); 
      return;
    }

    const allLabels = getLabels();
    let exists = false;

    if (idType === 'label') {
      exists = allLabels.some(l => l.idetiqueta === val && l.idetiqueta !== currentId);
    } else {
      for (const label of allLabels) {
        if (label.subRows) {
          const match = label.subRows.find(v => v.idvalor === val && v.idvalor !== currentId);
          if (match) {
            exists = true;
            break;
          }
        }
      }
    }

    if (exists) {
      setErrorState("Negative"); 
      setErrorMessage(`El ID "${val}" ya existe en el sistema.`);
    } else {
      setErrorState("None");
      setErrorMessage("");
    }

  }, [inputValue, idType, currentId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.stopPropagation();
      return;
    }
    if (e.key === "Enter") {
      if (errorState !== "Negative" && inputValue.trim() !== "") {
        onSave(inputValue);
      }
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      onCancel();
    }
    if (e.key === "Tab") {
      if (onTab) {
        e.preventDefault(); 
        e.stopPropagation();
        onTab(e, inputValue); 
      }
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ width: "100%" }}>
      <Input
        value={inputValue}
        // @ts-ignore - Por si TS se pone exigente con el string literal
        valueState={errorState}
        valueStateMessage={errorMessage ? <div slot="valueStateMessage">{errorMessage}</div> : undefined}
        onInput={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (errorState !== "Negative" && inputValue.trim() !== "") {
            onSave(inputValue);
          } else {
            onCancel();
          }
        }}
        style={{ width: "100%" }}
      />
    </div>
  );
};
