import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Input } from "@ui5/webcomponents-react";
import { addOperation, getLabels } from "../store/labelStore";
import { TableParentRow, TableSubRow } from "../services/labelService";
import { IndiceEditor, CatalogEditor, ParentValueEditor, NumericEditor } from "./Editors";
import '@ui5/webcomponents-icons/dist/background'; 
import { Icon, Tokenizer, Token } from '@ui5/webcomponents-react';

const COLUMN_TO_PAYLOAD_MAP: { [key: string]: string } = {
  etiqueta: "ETIQUETA",
  idetiqueta: "IDETIQUETA",
  idsociedad: "IDSOCIEDAD",
  idcedi: "IDCEDI",
  coleccion: "COLECCION",
  seccion: "SECCION",
  secuencia: "SECUENCIA",
  ruta: "ROUTE",
  descripcion: "DESCRIPCION",
  imagen: "IMAGEN",
  indice: "INDICE",
  
  valor: "VALOR",
  alias: "ALIAS",
  idvalor: "IDVALOR",     
  idvalorpa: "IDVALORPA"
};

export const PopoverCell = ({ value }: { value: string }) => {
  const cellRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number; flipX: boolean } | null>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (cellRef.current) {
        const { scrollWidth, clientWidth } = cellRef.current;
        setIsTruncated(scrollWidth > clientWidth);
      }
    };
    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [value]);

  const handleMouseEnter = () => {
    if (!cellRef.current || !isTruncated) return;

    const rect = cellRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const popoverMaxWidth = 400;
    const margin = 10;
    const estimatedPopoverHeight = 200;

    const availableSpaceRight = screenWidth - rect.right;
    const availableSpaceLeft = rect.left;

    let x = 0;
    let y = rect.top;
    let flipX = false;

    if (availableSpaceRight >= popoverMaxWidth + margin) {
      x = rect.right + 5;
      flipX = false;
    } else if (availableSpaceLeft >= popoverMaxWidth + margin) {
      x = rect.left - 5;
      flipX = true;
    } else if (availableSpaceLeft > availableSpaceRight) {
      x = rect.left - 5;
      flipX = true;
    } else {
      x = rect.right + 5;
      flipX = false;
    }

    if ((rect.top + estimatedPopoverHeight) > (screenHeight - margin)) {
      y = rect.bottom;
    } else {
      y = rect.top;
    }

    setPopoverPosition({ x, y, flipX });
  };

  const handleMouseLeave = () => {
    setPopoverPosition(null);
  };

  const popoverStyle: React.CSSProperties = popoverPosition ? (() => {
    const screenHeight = window.innerHeight;
    const margin = 10;
    const currentRect = cellRef.current?.getBoundingClientRect();

    const transformX = popoverPosition.flipX ? '-100%' : '0';
    let transformY = '-1px';

    if (currentRect && popoverPosition.y === currentRect.bottom) {
      transformY = '-100%';
    }

    const transform = `translate(${transformX}, ${transformY})`;

    return {
      position: 'fixed',
      zIndex: 100000,
      whiteSpace: 'pre-wrap',
      width: 'max-content',
      wordBreak: 'break-word',
      maxWidth: '400px',
      backgroundColor: 'var(--sapBackgroundColor, white)',
      border: '1px solid var(--sapField_BorderColor, #888)',
      boxShadow: '0 5px 10px rgba(0,0,0,0.3)',
      padding: '0.5rem',
      borderRadius: '4px',
      left: popoverPosition.x,
      top: popoverPosition.y,
      transform: transform,
      maxHeight: `calc(${screenHeight - margin * 2}px)`,
      overflowY: 'auto',
      color: 'var(--sapTextColor, black)',
      fontSize: '0.875rem',
      pointerEvents: 'none'
    };
  })() : {};

  return (
    <>
      <div
        ref={cellRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
          cursor: isTruncated ? 'help' : 'inherit'
        }}
      >
        {value}
      </div>
      {popoverPosition && createPortal(
        <div style={popoverStyle}>
          {value}
        </div>,
        document.body
      )}
    </>
  );
};

export const ImagePopoverCell = ({ value }: { value: string }) => {
  const cellRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number; flipX: boolean } | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [value]);

  if (!value) return null;

  const handleMouseEnter = () => {
    if (!cellRef.current) return;

    const rect = cellRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const popoverMaxWidth = 320;
    const margin = 10;
    const estimatedPopoverHeight = 320;

    const availableSpaceRight = screenWidth - rect.right;
    const availableSpaceLeft = rect.left;

    let x = 0;
    let y = rect.top;
    let flipX = false;

    if (availableSpaceRight >= popoverMaxWidth + margin) {
      x = rect.right + 5;
      flipX = false;
    } else if (availableSpaceLeft >= popoverMaxWidth + margin) {
      x = rect.left - 5;
      flipX = true;
    } else if (availableSpaceLeft > availableSpaceRight) {
      x = rect.left - 5;
      flipX = true;
    } else {
      x = rect.right + 5;
      flipX = false;
    }

    if ((rect.top + estimatedPopoverHeight) > (screenHeight - margin)) {
      y = rect.bottom;
    } else {
      y = rect.top;
    }

    setPopoverPosition({ x, y, flipX });
  };

  const handleMouseLeave = () => {
    setPopoverPosition(null);
  };

  const popoverStyle: React.CSSProperties = popoverPosition ? (() => {
    const currentRect = cellRef.current?.getBoundingClientRect();
    const transformX = popoverPosition.flipX ? '-100%' : '0';
    let transformY = '0';

    if (currentRect && popoverPosition.y === currentRect.bottom) {
      transformY = '-100%';
    }

    const transform = `translate(${transformX}, ${transformY})`;

    return {
      position: 'fixed',
      zIndex: 100000,
      padding: '0.5rem',
      backgroundColor: 'var(--sapBackgroundColor, white)',
      border: '1px solid var(--sapField_BorderColor, #888)',
      borderRadius: '4px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
      left: popoverPosition.x,
      top: popoverPosition.y,
      transform: transform,
      pointerEvents: 'none',
      maxWidth: '320px',
      maxHeight: '320px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    };
  })() : {};

  return (
    <>
      <div
        ref={cellRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex',
          alignItems: 'center', 
          justifyContent: 'flex-start',
          height: '100%',
          width: '100%',
        }}
      >
        {hasError ? (
          <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: 'var(--sapContent_LabelColor)', 
              fontSize: '0.75rem',
              fontStyle: 'italic'
          }}>
             <Icon name="background" /> 
             <span>No disponible</span> 
          </div>
        ) : (
          <img
            src={value}
            onError={() => setHasError(true)}
            style={{ 
              height: "30px", 
              width: "auto", 
              maxHeight: "100%", 
              cursor: "zoom-in" 
            }}
            alt="Vista previa" 
          />
        )}
      </div>

      {!hasError && popoverPosition && createPortal(
        <div style={popoverStyle}>
          <img
            src={value}
            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
            alt="preview"
          />
        </div>,
        document.body
      )}
    </>
  );
};

export const TokenViewCell = ({ value, onSave }: { value: any, onSave?: (val: any) => void }) => {
  const valueStr = (typeof value === 'string' && value) ? value : '';
    
  if (!valueStr.trim()) return null;

  const indices = valueStr.split(',').map(v => v.trim()).filter(v => v !== '');

  if (indices.length === 0) return null;

  const handleTokenDelete = (e: any) => {
    e.preventDefault(); 
    if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();

    const tokenToDelete = e.detail?.tokens?.[0]?.text;

    if (tokenToDelete && onSave) {
      const newTokens = indices.filter(t => t !== tokenToDelete);
      const newValueStr = newTokens.join(', ');
      onSave(newValueStr);
    }
  };

  return (
    <Tokenizer 
      title={valueStr} 
      style={{ width: '100%', padding: '0.25rem' }}
      onTokenDelete={handleTokenDelete}
      onClick={(e) => e.stopPropagation()}
    >
      {indices.map((text, index) => (
        <Token key={index} text={text} />
      ))}
    </Tokenizer>
  );
};

interface CatalogViewCellProps {
  value: any;
  catalogTag: "SOCIEDAD" | "CEDI"; 
}

export const CatalogViewCell = ({ value, catalogTag }: CatalogViewCellProps) => {
  const labelText = React.useMemo(() => {
      if (!value) return "";
      
      const allLabels = getLabels();
      const parentCatalog = allLabels.find(l => l.idetiqueta === catalogTag);
      
      if (parentCatalog && parentCatalog.subRows) {
          const match = parentCatalog.subRows.find(row => {
              if (row.idvalor === String(value)) return true;
              
              if (value !== "" && row.idvalor !== "" && !isNaN(Number(row.idvalor)) && !isNaN(Number(value))) {
                return Number(row.idvalor) === Number(value);
              }
              
              return false;
          });
          
          return match ? match.valor : value; 
      }
      return value;
  }, [value, catalogTag]);

  return (
    <div style={{ 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis',
        width: '100%' 
    }} title={labelText}>
        {labelText}
    </div>
  );
};

interface EditableCellProps {
  value: any;
  row: { original: TableParentRow | TableSubRow; index: number };
  column: { id: string };
  viewComponent: React.ComponentType<{ value: any; onSave?: (val: any) => void }>;
  editorType?: 'text' | 'indice' | 'sociedad' | 'cedi' | 'parentSelector' | 'numeric';
  viewProps?: any;
}

export const EditableCell = ({
  value: initialValue,
  row: { original: rowData },
  column: { id: columnId },
  viewComponent: ViewComponent,
  editorType = 'text',
  viewProps
}: EditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSave = (customValue?: any) => {
    setIsEditing(false);

    const finalValueToSave = customValue !== undefined ? customValue : value;

    if (finalValueToSave === initialValue) return;

    const isParent = 'parent' in rowData && rowData.parent === true;
    const id = isParent ? (rowData as TableParentRow).idetiqueta : (rowData as TableSubRow).idvalor;
    const parentId = (rowData as TableSubRow).idetiqueta;
    const fieldName = COLUMN_TO_PAYLOAD_MAP[columnId];

    if (!fieldName) {
      console.error(`No se encontró mapeo para la columna: ${columnId}`);
      return;
    }

    const processedValue = columnId === 'secuencia' ? Number(finalValueToSave) : finalValueToSave;
    setValue(processedValue);

    addOperation({
      collection: isParent ? 'labels' : 'values',
      action: 'UPDATE',
      payload: {
        id: id,
        IDETIQUETA: isParent ? undefined : parentId, 
        IDSOCIEDAD: Number(rowData.idsociedad),
        IDCEDI: Number(rowData.idcedi),
        updates: {
          [fieldName]: processedValue
        }
      }
    });
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  const renderEditor = () => {
    switch (editorType) {
      case 'indice':
        return <IndiceEditor value={value} onSave={handleSave} onCancel={handleCancel} />;
      case 'sociedad':
        return <CatalogEditor value={value} catalogTag="SOCIEDAD" onSave={handleSave} onCancel={handleCancel} />;
      case 'cedi':
        return <CatalogEditor value={value} catalogTag="CEDI" onSave={handleSave} onCancel={handleCancel} />;
      case 'parentSelector':
        return <ParentValueEditor value={value} onSave={handleSave} onCancel={handleCancel} />;
      case 'numeric':
        return <NumericEditor value={value} onSave={handleSave} onCancel={handleCancel} />;
      case 'text':
      default:
        return (
          <Input
            value={value}
            onInput={(e) => setValue(e.target.value)}
            onBlur={() => handleSave()}
            onKeyDown={(e) => {
              if(e.key === "ArrowLeft" || e.key === "ArrowRight") e.stopPropagation();
              if(e.key === "Enter") handleSave();
              if(e.key === "Escape") handleCancel();
            }}
            autoFocus
            style={{ width: '100%' }}
          />
        );
    }
  };

  if (isEditing) {
    return <div style={{ width: '100%' }}>{renderEditor()}</div>;
  }

  return (
    <div 
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      style={{  
        width: '100%', 
        height: '100%',
        cursor: 'cell',
        display: 'flex',
        alignItems: 'center', 
        justifyContent: 'flex-start'
      }}
      title="Doble clic para editar"
    >
      { ViewComponent ? <ViewComponent value={value} onSave={handleSave} {...viewProps} /> : <PopoverCell value={value} /> }
    </div>
  );
};

export const ParentValueViewCell = ({ value }: { value: any }) => {
  const labelText = React.useMemo(() => {
    if (!value) return "";
      
    const allLabels = getLabels();
      
    for (const label of allLabels) {
      if (label.subRows) {
        const match = label.subRows.find(v => v.idvalor === String(value));
        if (match) {
          return match.valor; 
        }
      }
    }
    return value; 
  }, [value]);

  return (
    <div style={{ 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis',
        width: '100%' 
    }} title={String(labelText)}>
        {labelText}
    </div>
  );
};
