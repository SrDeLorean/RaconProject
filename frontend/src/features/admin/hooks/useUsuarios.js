import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';
import { useDebounce } from '@/hooks/useDebounce';

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [notification, setNotification] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: '', status: 'activo' });
  
  // 🔥 MEJORA: Estado para los errores de validación de Laravel
  const [formErrors, setFormErrors] = useState({});

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const triggerNotification = (variant, text) => {
    setNotification({ variant, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUsuarios = useCallback(async () => {
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
  }, [currentPage, debouncedSearchTerm, activeTab]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormErrors({}); // 🔥 Limpiar errores antes de intentar guardar

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
      // 🔥 MEJORA: Control exacto del Error 422 (Validación de Laravel)
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors);
        triggerNotification('error', 'Por favor, revisa los campos marcados.');
      } else {
        triggerNotification('error', error.response?.data?.message || 'Error en la petición.');
      }
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

  // Envolvemos acciones en useCallback para que sean estables en el useMemo de columnas
  const openDrawer = useCallback((usuario = null) => {
    setSelectedUsuario(usuario);
    setFormErrors({}); // Limpiar errores al abrir el drawer
    setFormData(usuario 
      ? { name: usuario.name, email: usuario.email, password: '', role: usuario.role, status: usuario.status || 'activo' }
      : { name: '', email: '', password: '', role: '', status: 'activo' }
    );
    setIsDrawerOpen(true);
  }, []);

  const confirmDelete = useCallback((usuario) => {
    setUserToDelete(usuario);
    setIsDeleteModalOpen(true);
  }, []);

  return {
    data: { usuarios, totalRecords, currentPage, totalPages, searchTerm, activeTab },
    ui: { notification, isDrawerOpen, isDeleteModalOpen, isFetching, isSaving, isDeleting, selectedUsuario, userToDelete },
    form: { formData, setFormData, formErrors }, // Pasamos formErrors al controlador
    actions: { 
      setSearchTerm, setCurrentPage, setActiveTab, setNotification,
      openDrawer, closeDrawer: () => setIsDrawerOpen(false),
      confirmDelete, closeDeleteModal: () => setIsDeleteModalOpen(false),
      handleSave, executeDelete 
    }
  };
};