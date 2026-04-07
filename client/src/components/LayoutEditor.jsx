import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { Square, Circle, Save, Trash2, Armchair } from 'lucide-react';

export default function LayoutEditor({ initialData, onSave }) {
    const canvasRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const [showGuides, setShowGuides] = useState(false);
    const [selectedObject, setSelectedObject] = useState(null);
    const [labelText, setLabelText] = useState('');

    useEffect(() => {
        const c = new fabric.Canvas(canvasRef.current, {
            height: 600,
            width: 1000,
            backgroundColor: '#020617',
        });
        setCanvas(c);

        c.on('selection:created', (e) => handleSelection(e.selected[0]));
        c.on('selection:updated', (e) => handleSelection(e.selected[0]));
        c.on('selection:cleared', () => {
            setSelectedObject(null);
            setLabelText('');
        });

        if (initialData) {
            c.loadFromJSON(initialData, c.renderAll.bind(c));
        }

        return () => {
            c.dispose();
        };
    }, []);

    // Toggle Symmetry Guides
    useEffect(() => {
        if (!canvas) return;
        // Clear previous guides
        const objects = canvas.getObjects();
        objects.forEach(obj => {
            if (obj.isGuide) canvas.remove(obj);
        });

        if (showGuides) {
            const lineV = new fabric.Line([500, 0, 500, 600], {
                stroke: 'rgba(255,0,0,0.3)',
                selectable: false,
                evented: false,
                strokeDashArray: [5, 5]
            });
            lineV.isGuide = true;

            const lineH = new fabric.Line([0, 300, 1000, 300], {
                stroke: 'rgba(255,0,0,0.3)',
                selectable: false,
                evented: false,
                strokeDashArray: [5, 5]
            });
            lineH.isGuide = true;

            canvas.add(lineV, lineH);
            canvas.renderAll();
        }
    }, [showGuides, canvas]);

    const handleSelection = (obj) => {
        setSelectedObject(obj);
        // If it's a group, check if it has a label text object
        if (obj.type === 'group') {
            const textObj = obj.getObjects().find(o => o.type === 'text');
            if (textObj) setLabelText(textObj.text);
        } else {
            // If manual property
            setLabelText(obj.seatLabel || '');
        }
    };

    const updateLabel = (text) => {
        setLabelText(text);
        if (selectedObject) {
            if (selectedObject.type === 'group') {
                const textObj = selectedObject.getObjects().find(o => o.type === 'text');
                if (textObj) {
                    textObj.set('text', text);
                    selectedObject.set('seatLabel', text); // Custom prop
                    selectedObject.addWithUpdate(); // Recalc bounds
                    canvas.renderAll();
                }
            } else {
                selectedObject.set('seatLabel', text);
            }
        }
    };

    const addChair = () => {
        if (!canvas) return;
        const circle = new fabric.Circle({
            radius: 12,
            fill: '#cbd5e1',
            stroke: '#475569',
            strokeWidth: 1,
            originX: 'center',
            originY: 'center'
        });

        const text = new fabric.Text('A1', {
            fontSize: 10,
            originX: 'center',
            originY: 'center',
            fill: '#334155'
        });

        const group = new fabric.Group([circle, text], {
            left: 150,
            top: 150,
            seatLabel: 'A1' // Custom Property
        });

        canvas.add(group);
        canvas.setActiveObject(group);
    };

    // ... (Existing table functions can remain simple or become groups too)

    const addRectTable = () => {
        if (!canvas) return;
        const rect = new fabric.Rect({
            left: 100, top: 100, fill: '#a5b4fc', width: 60, height: 60, stroke: '#4338ca', strokeWidth: 2, rx: 4, ry: 4
        });
        canvas.add(rect);
    };

    const addRoundTable = () => {
        if (!canvas) return;
        const circle = new fabric.Circle({
            radius: 35, fill: '#fca5a5', left: 100, top: 100, stroke: '#b91c1c', strokeWidth: 2
        });
        canvas.add(circle);
    };

    const deleteSelected = () => {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            canvas.remove(activeObject);
            setSelectedObject(null);
        }
    };

    const handleSave = () => {
        if (!canvas) return;
        // Clean guides before saving? Or just exclude them
        const json = JSON.stringify(canvas.toJSON(['seatLabel'])); // Include custom property
        onSave(json);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 p-2 bg-slate-800 rounded-xl border border-slate-700 items-center">
                <button type="button" onClick={addRectTable} className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600">
                    <Square className="h-4 w-4 mr-2 text-indigo-400" /> Mesa Cuadrada
                </button>
                <button type="button" onClick={addRoundTable} className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600">
                    <Circle className="h-4 w-4 mr-2 text-red-400" /> Mesa Redonda
                </button>
                <button type="button" onClick={addChair} className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600">
                    <Armchair className="h-4 w-4 mr-2 text-slate-400" /> Silla
                </button>

                <div className="h-8 w-px bg-slate-600 mx-2"></div>

                <label className="flex items-center text-slate-300 text-sm gap-2 cursor-pointer bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600">
                    <input type="checkbox" checked={showGuides} onChange={e => setShowGuides(e.target.checked)} className="rounded border-slate-500 bg-slate-800 text-indigo-500" />
                    Ejes Simetría
                </label>

                <div className="flex-1"></div>

                {selectedObject && (
                    <div className="flex items-center gap-2 bg-indigo-900/30 px-3 py-1 rounded-lg border border-indigo-500/30">
                        <span className="text-xs text-indigo-300 uppercase font-bold">Etiqueta:</span>
                        <input
                            type="text"
                            className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs w-20"
                            value={labelText}
                            onChange={e => updateLabel(e.target.value)}
                        />
                    </div>
                )}

                <button type="button" onClick={deleteSelected} className="flex items-center px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                </button>
                <button type="button" onClick={handleSave} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-500/20 font-medium transition-all">
                    <Save className="h-4 w-4 mr-2" /> Guardar
                </button>
            </div>

            <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-slate-900">
                <div className="bg-slate-800 text-slate-400 text-xs px-2 py-1 flex justify-between">
                    <span>Lienzo de Diseño</span>
                    <span>1000 x 600 px</span>
                </div>
                {/* Canvas wrapper to center it if needed, or scroll */}
                <div className="overflow-auto max-h-[600px] bg-slate-900/50 flex justify-center p-4">
                    <canvas ref={canvasRef} />
                </div>
            </div>
            <p className="text-sm text-slate-400 text-center">
                Arrastra y suelta los elementos. Selecciona un objeto y presiona "Eliminar" para borrarlo.
            </p>
        </div>
    );
}

