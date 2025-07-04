"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Folder, File, ChevronRight, ChevronDown, Trash2, FilePlus, FolderPlus, Edit } from 'lucide-react';



export const FileStructureViewer = ({ 
  data,
  setFilecmd,
  currentFile, 
  setcurrentFile,
}) => {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [contextMenu, setContextMenu] = useState({ 
    visible: false, 
    x: 0, 
    y: 0, 
    item: null,
    isRoot: false 
  });
  const [renameState, setRenameState] = useState({ active: false, path: '', name: '' });
  const [newItem, setNewItem] = useState({ type: null, active: false, name: '', parentPath: '' });
  const [error, setError] = useState(null);
  const renameInputRef = useRef(null);
  const newItemInputRef = useRef(null);
  const containerRef = useRef(null);
  const defaultExpanded = true;

  const toggleFolder = (path, e) => {
    try {
      if (e) {
        e.stopPropagation();
      }
      setExpandedFolders(prev => ({
        ...prev,
        [path]: !prev[path]
      }));
    } catch (err) {
      setError(`Error toggling folder: ${err.message}`);
    }
  };

  const handleContextMenu = (e, item, path) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        item: item ? { ...item, path } : null,
        isRoot: !item
      });
    } catch (err) {
      setError(`Context menu error: ${err.message}`);
    }
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleRename = () => {
    try {
      if (!contextMenu.item) {
        throw new Error('No item selected for renaming');
      }
      setRenameState({
        active: true,
        path: contextMenu.item.path,
        name: contextMenu.item.name
      });
      closeContextMenu();
    } catch (err) {
      setError(`Rename error: ${err.message}`);
    }
  };

  const handleRenameSubmit = (e) => {
    try {
      e.preventDefault();
      if (!renameState.name.trim()) {
        throw new Error('Name cannot be empty');
      }
      
      const oldPath = renameState.path;
      const newPath = renameState.path.split('/').slice(0, -1).join('/') + '/' + renameState.name;
      
      setFilecmd({show: false, cmd: `mv /app/templates/${oldPath} /app/templates/${newPath}`});
      setRenameState({ active: false, path: '', name: '' });
    } catch (err) {
      setError(`Rename submit error: ${err.message}`);
    }
  };

  const handleCreateNewItem = (type) => {
    try {
      const parentPath = contextMenu.item?.path || '';
      setNewItem({ 
        type, 
        active: true, 
        name: '', 
        parentPath 
      });
      closeContextMenu();
    } catch (err) {
      setError(`Create item error: ${err.message}`);
    }
  };

  const handleNewItemSubmit = (e) => {
    try {
      e.preventDefault();
      if (!newItem.name.trim()) {
        throw new Error('Name cannot be empty');
      }
      
      const fullPath = newItem.parentPath ? `${newItem.parentPath}/${newItem.name}` : newItem.name;
      
      if (newItem.type === 'directory') {
        setFilecmd({show: false, cmd: `mkdir ${fullPath}`});
      } else {
        setFilecmd({show: false, cmd: `touch ${fullPath}`});
      }
      
      setNewItem({ type: null, active: false, name: '', parentPath: '' });
    } catch (err) {
      setError(`New item submit error: ${err.message}`);
    }
  };

  const handleDelete = () => {
    try {
      if (!contextMenu.item) {
        throw new Error('No item selected for deletion');
      }
      
      const path = contextMenu.item.path;
      if (contextMenu.item.type === 'directory') {
        setFilecmd({show: false, cmd: `rm -r ${path}`});
      } else {
        setFilecmd({show: false, cmd: `rm ${path}`});
      }
      
      closeContextMenu();
    } catch (err) {
      setError(`Delete error: ${err.message}`);
    }
  };

  const cancelNewItem = () => {
    setNewItem({ type: null, active: false, name: '', parentPath: '' });
  };

  const cancelRename = () => {
    setRenameState({ active: false, path: '', name: '' });
  };

  useEffect(() => {
    if (renameState.active && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renameState.active]);

  useEffect(() => {
    if (newItem.active && newItemInputRef.current) {
      newItemInputRef.current.focus();
    }
  }, [newItem.active]);

  const renderItem = (item, path = '', depth = 0) => {
    try {
      const currentPath = path ? `${path}/${item.name}` : item.name;
      const isExpanded = expandedFolders[currentPath] ?? defaultExpanded;
      const indentSize = depth * 16;

      if (item.type === 'directory') {
        return (
          <div key={currentPath} className="min-w-max">
            <div 
              className="flex items-center py-0.5 my-0.5 hover:bg-gray-800 rounded cursor-pointer min-w-0"
              style={{ marginLeft: `${indentSize}px` }}
              onContextMenu={(e) => handleContextMenu(e, item, currentPath)}
            >
              <span 
                className="flex-shrink-0"
                onClick={(e) => toggleFolder(currentPath, e)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                )}
              </span>
              <Folder 
                className="w-3.5 h-3.5 mr-1 text-blue-500 flex-shrink-0" 
                onClick={(e) => toggleFolder(currentPath, e)}
              />
              {renameState.active && renameState.path === currentPath ? (
                <div className="flex-grow">
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameState.name}
                    onChange={(e) => setRenameState({...renameState, name: e.target.value})}
                    onBlur={cancelRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(e);
                      if (e.key === 'Escape') cancelRename();
                    }}
                    className="w-full bg-gray-700 text-white px-1 rounded text-xs"
                    autoFocus
                  />
                </div>
              ) : (
                <span 
                  className="truncate flex-grow min-w-0"
                  onClick={(e) => toggleFolder(currentPath, e)}
                >
                  {item.name}
                </span>
              )}
            </div>
            
            {newItem.active && newItem.parentPath === currentPath && (
              <div className="flex items-center py-0.5 my-0.5 bg-gray-900 border border-gray-600 rounded" style={{ marginLeft: `${indentSize + 24}px` }}>
                <span className="flex-shrink-0">
                  {newItem.type === 'directory' ? (
                    <Folder className="w-3.5 h-3.5 mr-1 text-blue-500 flex-shrink-0" />
                  ) : (
                    <File className="w-3.5 h-3.5 mr-1 text-gray-500 flex-shrink-0" />
                  )}
                </span>
                <div className="flex-grow">
                  <input
                    ref={newItemInputRef}
                    type="text"
                    value={newItem.name || ''}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    onBlur={cancelNewItem}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNewItemSubmit(e);
                      if (e.key === 'Escape') cancelNewItem();
                    }}
                    className="w-full bg-gray-700 text-white px-1 rounded text-xs"
                    autoFocus
                    placeholder={`New ${newItem.type} name`}
                  />
                </div>
              </div>
            )}
            
            {isExpanded && item.children?.map(child => renderItem(child, currentPath, depth + 1))}
          </div>
        );
      }

      return (
        <div 
          key={currentPath} 
          className={`flex items-center py-0.5 my-0.5 hover:bg-gray-800 rounded px-2 min-w-0 cursor-pointer ${currentFile === currentPath ? 'bg-gray-800' : ''}`}
          style={{ marginLeft: `${indentSize}px` }}
          onClick={(e) => {
            e.stopPropagation();
            setcurrentFile(currentPath);
            if(item.type==='file') {
              setFilecmd({show: true, cmd:`/app/templates/${currentPath}`});
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, item, currentPath)}
        >
          <File className="w-3.5 h-3.5 mr-1 text-gray-500 flex-shrink-0" />
          {renameState.active && renameState.path === currentPath ? (
            <div className="flex-grow">
              <input
                ref={renameInputRef}
                type="text"
                value={renameState.name}
                onChange={(e) => setRenameState({...renameState, name: e.target.value})}
                onBlur={cancelRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(e);
                  if (e.key === 'Escape') cancelRename();
                }}
                className="w-full bg-gray-700 text-white px-1 rounded text-xs"
                autoFocus
              />
            </div>
          ) : (
            <span className="truncate cursor-default flex-grow">{item.name}</span>
          )}
        </div>
      );
    } catch (err) {
      setError(`Render error for ${item.name}: ${err.message}`);
      return null;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="font-mono text-[13.5px] p-2 w-full overflow-hidden relative min-h-full bg-gray-900 text-white"
      onClick={closeContextMenu}
      onContextMenu={(e) => handleContextMenu(e, null, null)}
    >
      {error && (
        <div className="bg-red-900 text-white p-2 mb-2 rounded text-xs">
          Error: {error}
          <button 
            onClick={() => setError(null)} 
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {newItem.active && newItem.parentPath === '' && (
        <div className="flex items-center py-0.5 my-0.5 bg-gray-900 border border-gray-600 rounded">
          <span className="flex-shrink-0">
            {newItem.type === 'directory' ? (
              <Folder className="w-3.5 h-3.5 mr-1 text-blue-500 flex-shrink-0" />
            ) : (
              <File className="w-3.5 h-3.5 mr-1 text-gray-500 flex-shrink-0" />
            )}
          </span>
          <div className="flex-grow">
            <input
              ref={newItemInputRef}
              type="text"
              value={newItem.name || ''}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              onBlur={cancelNewItem}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNewItemSubmit(e);
                if (e.key === 'Escape') cancelNewItem();
              }}
              className="w-full bg-gray-700 text-white px-1 rounded text-xs"
              autoFocus
              placeholder={`New ${newItem.type} name`}
            />
          </div>
        </div>
      )}

      {data?.children?.length > 0 ? (
        data.children.map(item => renderItem(item))
      ) : (
        <div className="text-gray-400 px-2 py-1">No files yet</div>
      )}

      {contextMenu.visible && (
        <div 
          className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg py-1 z-50 w-48"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.isRoot ? (
            <>
              <div 
                className="flex items-center px-3 py-1 hover:bg-gray-700 cursor-pointer"
                onClick={() => handleCreateNewItem('file')}
              >
                <FilePlus className="w-3.5 h-3.5 mr-2" />
                <span>New File</span>
              </div>
              <div 
                className="flex items-center px-3 py-1 hover:bg-gray-700 cursor-pointer"
                onClick={() => handleCreateNewItem('directory')}
              >
                <FolderPlus className="w-3.5 h-3.5 mr-2" />
                <span>New Folder</span>
              </div>
            </>
          ) : (
            <>
              {contextMenu.item?.type === 'directory' && (
                <>
                  <div 
                    className="flex items-center px-3 py-1 hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleCreateNewItem('file')}
                  >
                    <FilePlus className="w-3.5 h-3.5 mr-2" />
                    <span>New File</span>
                  </div>
                  <div 
                    className="flex items-center px-3 py-1 hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleCreateNewItem('directory')}
                  >
                    <FolderPlus className="w-3.5 h-3.5 mr-2" />
                    <span>New Folder</span>
                  </div>
                  <hr className="border-gray-700 my-1" />
                </>
              )}
              <div 
                className="flex items-center px-3 py-1 hover:bg-gray-700 cursor-pointer"
                onClick={handleRename}
              >
                <Edit className="w-3.5 h-3.5 mr-2" />
                <span>Rename</span>
              </div>
              <div 
                className="flex items-center px-3 py-1 hover:bg-red-600 cursor-pointer"
                onClick={handleDelete}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                <span>Delete</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};