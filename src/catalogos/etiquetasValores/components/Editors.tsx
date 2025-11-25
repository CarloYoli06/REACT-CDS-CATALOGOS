import React, { useState, useEffect, useMemo } from "react";
import {
  Input,
  MultiInput,
  Token,
  ComboBox,
  ComboBoxItem,
} from "@ui5/webcomponents-react";
import '@ui5/webcomponents-icons/dist/value-help';
import '@ui5/webcomponents-icons/dist/decline';
import { getLabels } from "../store/labelStore";
import { TableSubRow } from "../services/labelService";
import ValueHelpSelector from "./ValueHelpSelector"; 

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

export const CatalogEditor = ({ value, onSave, onCancel, onTab, catalogTag }: CatalogEditorProps) => {
  const [options, setOptions] = useState<TableSubRow[]>([]);
  const [inputValue, setInputValue] = useState("");
  const isSelectingRef = React.useRef(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null); 

  useEffect(() => {
    const allLabels = getLabels();
    const parentCatalog = allLabels.find(l => l.idetiqueta === catalogTag);
    if (parentCatalog && parentCatalog.subRows) {
      setOptions(parentCatalog.subRows);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [catalogTag]);

  useEffect(() => {
    const foundOption = options.find(o => 
      o.idvalor === String(value) || 
      (value !== "" && o.idvalor !== "" && !isNaN(Number(o.idvalor)) && !isNaN(Number(value)) && Number(o.idvalor) === Number(value))
    );
    if (foundOption) {
      setInputValue(foundOption.valor);
    } else {
      setInputValue(value || "");
    }
  }, [value, options]);

  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    const lowerInput = inputValue.toLowerCase();
    return options.filter(opt => 
      opt.valor.toLowerCase().includes(lowerInput) || 
      opt.idvalor.toLowerCase().includes(lowerInput)
    );
  }, [options, inputValue]);

  const handleChange = (e: any) => {
    if (e.detail.item) {
      isSelectingRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const selectedId = e.detail.item.dataset.id;
      const selectedText = e.detail.item.text;

      setInputValue(selectedText);
      onSave(selectedId); 
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if(e.key === "Enter") {
      isSelectingRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // @ts-ignore
      const inputText = inputValue;
      const match = options.find(opt => opt.valor === inputText || opt.idvalor === inputText);
      if (match) {
        onSave(match.idvalor);
      } else {
        onCancel();
      }
    }
    if(e.key === "Escape") onCancel();
    if (e.key === "Tab") {
      if (onTab) {
        e.preventDefault(); 
        e.stopPropagation();

        const currentText = inputValue;
        const match = options.find(opt => 
          opt.valor === currentText || 
          opt.idvalor === currentText 
        );

        if (match) {
          onTab(e, match.idvalor);
        } else {
          onTab(e, ""); 
        }
      }
    }
  };

  const handleBlur = () => {
    const currentText = inputValue;

    timeoutRef.current = setTimeout(() => {
      if (!isSelectingRef.current) {
        if (!currentText || currentText.trim() === "") {
          onSave("");
          return;
        }

        const match = options.find(opt => 
          opt.valor === currentText || 
          opt.idvalor === currentText 
        );

        if (match) {
          onSave(match.idvalor);
        } else {
          onCancel();
        }
      }
    }, 200);
  };

  const handleInput = (e: any) => {
    setInputValue(e.target.value);
  };

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      onDoubleClick={(e) => e.stopPropagation()} 
      style={{ width: "100%" }}
    >
    <ComboBox
      value={inputValue}
      onInput={handleInput}
      onSelectionChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{ width: "100%" }}
      filter="None"
    >
      {filteredOptions.map(opt => (
        <ComboBoxItem 
          text={opt.valor}
          key={opt.idvalor} 
          data-id={opt.idvalor}
          additionalText={opt.idvalor}
        />
      ))}
    </ComboBox>
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
