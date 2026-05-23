import { useState, useEffect } from 'react';
import api from '@/api/axios';
import { useDebounce } from '@/hooks/useDebounce';

export const useUsuarios = () => {
  // 1. Estados de Datos y Paginación
  const [usuarios, setUsuarios] = useState([]);
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // 2. Estados de UI (Notificaciones y Modales)
  const [notification, setNotification] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // 3. Estados de Entidades
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: '', status: 'activo' });

  // 4. Estados de Carga
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Implementación del Hook genérico de Debounce (400ms de retraso)
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const triggerNotification = (variant, text) => {
    setNotification({ variant, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUsuarios = async () => {
    setIsFetching(true);
    try {
      const params = {
        page: currentPage,
        per_page: 10,
        search: debouncedSearchTerm !== '' ? debouncedSearchTerm : undefined,
        role: activeTab !== 'todos' ? activeTab : undefined,
      };
      
      const response = await api.get('/users', { params });
      const responseData = response.data;
      
      setUsuarios(responseData.data || []);
      setTotalPages(responseData.meta?.last_page || responseData.last_page || 1);
      setTotalRecords(responseData.meta?.total || responseData.total || 0);
    } catch (error) {
      triggerNotification('error', 'No se pudieron sincronizar los usuarios.');
    } finally {
      setIsFetching(false);
    }
  };

  // El efecto ahora reacciona de forma limpia a los cambios sin timeouts locales manuales
  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm, activeTab]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (selectedUsuario) {
        await api.put(`/users/${selectedUsuario.id}`, formData);
        triggerNotification('success', 'Usuario actualizado con éxito.');
      } else {
        await api.post('/users', formData);
        triggerNotification('success', 'Usuario creado con éxito.');
      }
      await fetchUsuarios();
      setIsDrawerOpen(false);
    } catch (error) {
      triggerNotification('error', error.response?.data?.message || 'Error en la petición.');
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      triggerNotification('success', 'Usuario eliminado con éxito.');
      
      if (usuarios.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        await fetchUsuarios();
      }
      setIsDeleteModalOpen(false);
    } catch (error) {
      triggerNotification('error', 'No se pudo eliminar el usuario.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDrawer = (usuario = null) => {
    setSelectedUsuario(usuario);
    setFormData(usuario 
      ? { name: usuario.name, email: usuario.email, password: '', role: usuario.role, status: usuario.status || 'activo' }
      : { name: '', email: '', password: '', role: '', status: 'activo' }
    );
    setIsDrawerOpen(true);
  };

  const confirmDelete = (usuario) => {
    setUserToDelete(usuario);
    setIsDeleteModalOpen(true);
  };

  return {
    data: { usuarios, totalRecords, currentPage, totalPages, searchTerm, activeTab },
    ui: { notification, isDrawerOpen, isDeleteModalOpen, isFetching, isSaving, isDeleting, selectedUsuario, userToDelete },
    form: { formData, setFormData },
    actions: { 
      setSearchTerm, setCurrentPage, setActiveTab, setNotification,
      openDrawer, closeDrawer: () => setIsDrawerOpen(false),
      confirmDelete, closeDeleteModal: () => setIsDeleteModalOpen(false),
      handleSave, executeDelete 
    }
  };
};