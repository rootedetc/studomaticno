import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

function TreeNode({ node, level, currentFolderId, onNavigate, expandedNodes, toggleExpand }) {
  const hasChildren = node.children && node.children.length > 0;
  const nodeKey = node.id;
  const isExpanded = expandedNodes.has(nodeKey);
  const isSelected = currentFolderId === node.hierarchyId;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-1 py-1 pr-2 cursor-pointer rounded-md transition-colors ${
          isSelected ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onNavigate(node)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand(nodeKey);
          }}
          className={`w-5 h-5 flex items-center justify-center transition-transform ${
            hasChildren ? '' : 'invisible'
          }`}
        >
          <svg
            className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
        <span className="text-sm truncate">{node.name}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.hierarchyId || child.id}
              node={child}
              level={level + 1}
              currentFolderId={currentFolderId}
              onNavigate={onNavigate}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FileIcon({ type }) {
  const iconColors = {
    pdf: 'text-red-500 bg-red-50',
    doc: 'text-blue-500 bg-blue-50',
    xls: 'text-green-500 bg-green-50',
    ppt: 'text-orange-500 bg-orange-50',
    zip: 'text-gray-500 bg-gray-100',
    image: 'text-purple-500 bg-purple-50',
    unknown: 'text-gray-400 bg-gray-100'
  };

  const colorClass = iconColors[type] || iconColors.unknown;

  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
  );
}

function Files() {
  const [tree, setTree] = useState([]);
  const [currentFolder, setCurrentFolder] = useState({ idHijer: 0, name: 'Dokumenti', path: [] });
  const [files, setFiles] = useState([]);
  const [subfolders, setSubfolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    loadTree();
    loadFolder({ id: 'root', idHijer: 0, name: 'Dokumenti', path: [] });
  }, []);

  const loadTree = async () => {
    setLoading(true);
    setError('');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const result = await api.getFilesTree();
      clearTimeout(timeoutId);
      
      setExpandedNodes(new Set());
      setTree(result.tree || []);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out');
      } else {
        setError('Failed to load tree: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFolder = useCallback(async (folder) => {
    setLoading(true);
    setError('');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const result = await api.getFilesByHijer(folder.idHijer);
      clearTimeout(timeoutId);
      setFiles(result.files || []);
      setCurrentFolder(folder);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out');
      } else {
        setError('Failed to load folder: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleExpand = (nodeKey) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeKey)) {
        newSet.delete(nodeKey);
      } else {
        newSet.add(nodeKey);
      }
      return newSet;
    });
  };

  const findPathToNode = useCallback((nodes, targetHierId) => {
    for (const node of nodes) {
      if (node.hierarchyId === targetHierId) {
        return [node.id];
      }
      if (node.children) {
        const path = findPathToNode(node.children, targetHierId);
        if (path) {
          return [node.id, ...path];
        }
      }
    }
    return null;
  }, []);

  useEffect(() => {
    if (tree.length === 0 || currentFolder.idHijer === 0) return;

    const path = findPathToNode(tree, currentFolder.idHijer);
    if (path) {
      setExpandedNodes((prev) => {
        const newSet = new Set(prev);
        path.forEach((nodeId) => newSet.add(nodeId));
        return newSet;
      });
    }
  }, [tree, currentFolder.idHijer, findPathToNode]);

  const handleNavigate = (node) => {
    const newPath = [...currentFolder.path, { idHijer: currentFolder.idHijer, name: currentFolder.name }];
    loadFolder({
      id: node.id,
      idHijer: node.hierarchyId,
      name: node.name,
      path: newPath
    });
  };

  const handleBreadcrumbClick = (index) => {
    const newPath = currentFolder.path.slice(0, index);
    let folder;
    if (index === 0) {
      folder = { id: 'root', idHijer: 0, name: 'Dokumenti', path: [] };
    } else {
      const pathItem = newPath[index - 1];
      folder = { id: `crumb-${index}`, idHijer: pathItem.idHijer, name: pathItem.name, path: newPath.slice(0, index - 1) };
    }
    loadFolder(folder);
  };

  const handleDownload = async (id, name) => {
    setDownloading(id);
    try {
      const { blob } = await api.downloadFile(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Download failed: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  const getSubfoldersForCurrent = useCallback(() => {
    const findNode = (nodes, hierId) => {
      for (const node of nodes) {
        if (node.hierarchyId === hierId) return node;
        if (node.children) {
          const found = findNode(node.children, hierId);
          if (found) return found;
        }
      }
      return null;
    };
    const currentNode = findNode(tree, currentFolder.idHijer);
    return currentNode?.children || [];
  }, [tree, currentFolder.idHijer]);

  if (loading && files.length === 0) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 lg:p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">Dokumenti</h1>
        <p className="text-gray-600 text-sm mt-1">{files.length} datoteka</p>
      </div>

      {error && (
        <div className="mx-4 lg:mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden lg:block w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mape</h3>
            {tree.map((node) => (
              <TreeNode
                key={node.hierarchyId || node.id}
                node={node}
                level={0}
                currentFolderId={currentFolder.idHijer}
                onNavigate={handleNavigate}
                expandedNodes={expandedNodes}
                toggleExpand={toggleExpand}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              {currentFolder.path.map((item, index) => (
                <span key={index} className="flex items-center gap-2">
                  <button
                    onClick={() => handleBreadcrumbClick(index + 1)}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {item.name}
                  </button>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              ))}
              <span className="text-gray-900 font-medium">{currentFolder.name}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="loading-spinner w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
              </div>
            ) : files.length === 0 && getSubfoldersForCurrent().length === 0 ? (
              <div className="card text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">Ova mapa je prazna</p>
              </div>
            ) : (
              <div className="space-y-6 max-w-full overflow-hidden">
                {getSubfoldersForCurrent().length > 0 && (
                  <div className="max-w-full overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Podmape</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full max-w-full overflow-hidden">
                      {getSubfoldersForCurrent().map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => handleNavigate(folder)}
                          className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left w-full overflow-hidden max-w-full"
                        >
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          </svg>
                          <span className="text-xs sm:text-sm text-gray-700 line-clamp-2 break-long block w-full text-left min-w-0">{folder.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {files.length > 0 && (
                  <div className="max-w-full overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Datoteke</h3>
                    <div className="space-y-2 w-full max-w-full overflow-hidden">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="card flex items-center gap-3 hover:shadow-sm transition-shadow w-full max-w-full overflow-hidden"
                        >
                          <FileIcon type={file.type} />
                          <div className="flex-1 min-w-0 w-full max-w-full overflow-hidden">
                            <h4 className="font-medium text-gray-900 line-clamp-1 break-long">{file.name}</h4>
                            {file.description && <p className="text-xs text-gray-500 line-clamp-1 break-long mt-0.5">{file.description}</p>}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1 overflow-hidden">
                              {file.date && <span className="line-clamp-1 break-long">{file.date}</span>}
                              {file.size && <span className="flex-shrink-0 whitespace-nowrap text-gray-400">{file.size}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownload(file.id, file.name)}
                            disabled={downloading === file.id}
                            className="flex-shrink-0 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {downloading === file.id ? (
                              <span className="loading-spinner w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full"></span>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Files;
