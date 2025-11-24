import React, { useState, useEffect, useMemo } from "react";
import {
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
  rowOriginal?: any;
}

// --- EDITOR DE INDICE ---
export const IndiceEditor = ({ value, onSave, onCancel }: EditorProps) => {
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

export const CatalogEditor = ({ value, onSave, onCancel, catalogTag }: CatalogEditorProps) => {
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
    const foundOption = options.find(o => o.idvalor === value);
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
export const ParentValueEditor = ({ value, onSave, onCancel }: EditorProps) => {
  const allData = useMemo(() => getLabels(), []);

  const handleSelect = (selectedValue: string | null) => {
    if (selectedValue !== undefined) {
      onSave(selectedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
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
