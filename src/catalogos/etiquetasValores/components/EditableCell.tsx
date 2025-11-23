import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Input } from "@ui5/webcomponents-react";
import { addOperation } from "../store/labelStore";
import { TableParentRow, TableSubRow } from "../services/labelService";
import '@ui5/webcomponents-icons/dist/background'; // O 'picture', 'image-missing', etc.
import { Icon } from '@ui5/webcomponents-react';

const COLUMN_TO_PAYLOAD_MAP: { [key: string]: string } = {
  etiqueta: "ETIQUETA",
  idetiqueta: "IDETIQUETA",
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

// --- COMPONENTE POPOVER PARA TEXTO ---
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

// --- NUEVO COMPONENTE POPOVER PARA IMAGENES ---
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

// --- COMPONENTE PRINCIPAL EDITABLE ---
interface EditableCellProps {
  value: any;
  row: { original: TableParentRow | TableSubRow; index: number };
  column: { id: string };
  viewComponent?: React.ComponentType<{ value: any }>;
}

export const EditableCell = ({
  value: initialValue,
  row: { original: rowData },
  column: { id: columnId },
  viewComponent: ViewComponent,
}: EditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  // Sincronizar estado si la prop cambia externamente
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    setIsEditing(false);

    // 1. Si no hay cambios, no hacemos nada
    if (value === initialValue) return;

    // 2. Determinar si es Padre o Hijo
    const isParent = 'parent' in rowData && rowData.parent === true;
    
    // 3. Obtener IDs
    const id = isParent 
      ? (rowData as TableParentRow).idetiqueta 
      : (rowData as TableSubRow).idvalor;
    
    // Para hijos necesitamos el ID del padre (idetiqueta) para el contexto
    const parentId = (rowData as TableSubRow).idetiqueta;

    // 4. Mapear el campo
    const fieldName = COLUMN_TO_PAYLOAD_MAP[columnId];

    if (!fieldName) {
      console.error(`No se encontró mapeo para la columna: ${columnId}`);
      return;
    }

    // 5. Preparar Updates
    // Manejo especial para números si fuera necesario (ej. secuencia)
    const finalValue = columnId === 'secuencia' ? Number(value) : value;
    
    const updates = {
      [fieldName]: finalValue
    };

    console.log(`Guardando cambio en ${isParent ? 'Etiqueta' : 'Valor'} [${id}]: ${columnId} -> ${finalValue}`);

    // 6. Enviar al Store
    addOperation({
      collection: isParent ? 'labels' : 'values',
      action: 'UPDATE',
      payload: {
        id: id,
        IDETIQUETA: isParent ? undefined : parentId, 
        updates: updates
      }
    });
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.stopPropagation(); 
      return; 
    }
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  if (isEditing) {
    return (
      <Input
        value={value}
        onInput={(e) => setValue(e.target.value)}
        onBlur={handleSave} 
        onKeyDown={onKeyDown}
        autoFocus
        style={{ width: '100%' }}
      />
    );
  }

  return (
    <div 
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      style={{ width: '100%', 
                height: '100%',
                cursor: 'cell',
                display: 'flex',
                alignItems: 'center', 
                justifyContent: 'flex-start'
              }}
      title="Doble clic para editar"
    >
      {ViewComponent ? (
        <ViewComponent value={value} />
      ) : (
        <PopoverCell value={value} />
      )}
    </div>
  );
};
