import { useState, useEffect, useCallback, memo } from 'react';
import api from '../services/api';
import { getFriendlyErrorMessage } from '../utils/helpers';
import { Skeleton, SkeletonCard } from '../components/Skeleton';
import Icon from '../components/Icon';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';

const TreeNode = memo(function TreeNode({ node, level, currentFolderId, onNavigate, expandedNodes, toggleExpand }) {
  const hasChildren = node.children && node.children.length > 0;
  const nodeKey = node.id;
  const isExpanded = expandedNodes.has(nodeKey);
  const isSelected = currentFolderId === node.hierarchyId;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-1 py-1 pr-2 cursor-pointer rounded-md transition-colors ${isSelected ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onNavigate(node)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNavigate(node);
          }
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand(nodeKey);
          }}
          className={`w-5 h-5 flex items-center justify-center transition-transform ${hasChildren ? '' : 'invisible'
            }`}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <Icon name="expand" className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} aria-hidden="true" />
        </button>
        <Icon name="folder" className="w-4 h-4 text-yellow-500 flex-shrink-0" aria-hidden="true" />
        <span className="text-sm text-gray-900 dark:text-white truncate">{node.name}</span>
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
});

const FileIcon = memo(function FileIcon({ type }) {
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
      <Icon name="file" className="w-5 h-5" aria-hidden="true" />
    </div>
  );
});

function Files() {
  const [tree, setTree] = useState([]);
  const [currentFolder, setCurrentFolder] = useState({ idHijer: 0, name: 'Dokumenti', path: [] });
  const [files, setFiles] = useState([]);
  const [subfolders, setSubfolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    loadTree();
    loadFolder({ id: 'root', idHijer: 0, name: 'Dokumenti', path: [] });
  }, []);

  const loadTree = async () => {
    setTreeLoading(true);
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
      setTreeLoading(false);
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

  const getPathFromTree = useCallback((nodes, targetId) => {
    for (const node of nodes) {
      if (node.hierarchyId == targetId) {
        return [{ idHijer: node.hierarchyId, name: node.name }];
      }
      if (node.children) {
        const path = getPathFromTree(node.children, targetId);
        if (path) {
          return [{ idHijer: node.hierarchyId, name: node.name }, ...path];
        }
      }
    }
    return null;
  }, []);

  useEffect(() => {
    if (tree.length === 0 || currentFolder.idHijer === 0) return;

    // Use a different helper or the same findPathToNode logic if just needing IDs for expansion
    // But since we removed findPathToNode, let's just re-implement a simple ID finder or use getPathFromTree and map to IDs?
    // Actually, for expansion we need node IDs (not hierarchy IDs typically, unless they are same). 
    // The original findPathToNode returned [node.id, ...]. 
    // Let's reimplement a specific helper for this to avoid confusion or reuse getPathFromTree if IDs align.
    // Looking at original code: node.id is used for expansion keys. node.hierarchyId is used for API calls.

    const findNodeIdsPath = (nodes, targetHierId) => {
      for (const node of nodes) {
        if (node.hierarchyId === targetHierId) return [node.id];
        if (node.children) {
          const path = findNodeIdsPath(node.children, targetHierId);
          if (path) return [node.id, ...path];
        }
      }
      return null;
    };

    const path = findNodeIdsPath(tree, currentFolder.idHijer);
    if (path) {
      setExpandedNodes((prev) => {
        const newSet = new Set(prev);
        path.forEach((nodeId) => newSet.add(nodeId));
        return newSet;
      });
    }
  }, [tree, currentFolder.idHijer]);

  const handleNavigate = (node) => {
    // Reconstruct path from tree to ensure accuracy
    const treePath = getPathFromTree(tree, node.hierarchyId) || [];
    // The request to loadFolder expects the specific folder shape.
    // We can just pass the path we found. 
    // Note: getPathFromTree returns [{idHijer, name}, ...].
    // loadFolder needs the `path` prop to be the array of parents.
    // The current folder is the LAST item in treePath. 
    // Parents are everything before it.

    // Actually, `currentFolder.path` in state usage seems to be "parents list".
    // Let's verify: 
    // In handleBreadcrumbClick:
    // folder = { ..., path: newPath.slice(0, index - 1) } 
    // So `path` is indeed parents.

    const parents = treePath.slice(0, -1);

    loadFolder({
      id: node.id,
      idHijer: node.hierarchyId,
      name: node.name,
      path: parents
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
      const { blob, fileExtension } = await api.downloadFile(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name + fileExtension;
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

  const isLoadingInitial = (loading && files.length === 0) || (treeLoading && tree.length === 0);

  if (isLoadingInitial) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Skeleton variant="text" height="h-8" width="w-32" className="mb-2" />
          <Skeleton variant="text" width="w-20" />
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="hidden lg:block w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
            <div className="p-3">
              <Skeleton variant="text" height="h-4" width="w-16" className="mb-2" />
              <SkeletonCard count={5} />
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800">
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <Skeleton variant="text" height="h-4" width="w-24" />
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Dokumenti', path: '/', onClick: () => loadFolder({ id: 'root', idHijer: 0, name: 'Dokumenti', path: [] }) },
    ...currentFolder.path.map((item, index) => ({
      label: item.name,
      onClick: () => handleBreadcrumbClick(index + 1)
    }))
  ];

  return (
    <div className="flex-1 flex flex-col h-full">
      <PageHeader
        title="Dokumenti"
        subtitle={`${files.length} datoteka`}
        breadcrumbs={breadcrumbs}
      />

      {error && (
        <div className="mx-4 lg:mx-6 mt-4 error-banner flex-shrink-0">
          {getFriendlyErrorMessage(error)}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden lg:block w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto flex-shrink-0">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Mape</h3>
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

        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
            {loading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </div>
            ) : files.length === 0 && getSubfoldersForCurrent().length === 0 ? (
              <EmptyState
                icon="emptyFiles"
                title="Ova mapa je prazna"
              />
            ) : (
              <div className="space-y-6 max-w-full overflow-hidden">
                {getSubfoldersForCurrent().length > 0 && (
                  <div className="max-w-full overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Podmape</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full max-w-full overflow-hidden">
                      {getSubfoldersForCurrent().map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => handleNavigate(folder)}
                          className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-left w-full overflow-hidden max-w-full"
                        >
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          </svg>
                          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-2 break-long block w-full text-left min-w-0">{folder.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {files.length > 0 && (
                  <div className="max-w-full overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Datoteke</h3>
                    <div className="space-y-2 w-full max-w-full overflow-hidden">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="card flex items-center gap-3 hover:shadow-sm transition-shadow w-full max-w-full overflow-hidden"
                        >
                          <FileIcon type={file.type} />
                          <div className="flex-1 min-w-0 w-full max-w-full overflow-hidden">
                            <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1 break-long">{file.name}</h4>
                            {file.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 break-long mt-0.5">{file.description}</p>}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1 overflow-hidden">
                              {file.date && <span className="line-clamp-1 break-long">{file.date}</span>}
                              {file.size && <span className="flex-shrink-0 whitespace-nowrap text-gray-400 dark:text-gray-500">{file.size}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownload(file.id, file.name)}
                            disabled={downloading === file.id}
                            className="flex-shrink-0 p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {downloading === file.id ? (
                              <span className="loading-spinner w-5 h-5 border-2 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full"></span>
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
