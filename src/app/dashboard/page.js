'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [contacts, setContacts] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '' })
  const [editingContact, setEditingContact] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const router = useRouter()

  const fetchContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      setContacts(data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast.error('Error al cargar los contactos')
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [router])

  const handleAddContact = async (e) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (editingContact) {
        // Actualizar contacto
        const { data, error } = await supabase
          .from('contacts')
          .update({ ...newContact })
          .eq('id', editingContact.id)
          .select()

        if (error) throw error

        setContacts(contacts.map(contact => 
          contact.id === editingContact.id ? data[0] : contact
        ))
        toast.success('Contacto actualizado')
      } else {
        // Crear nuevo contacto
        const { data, error } = await supabase
          .from('contacts')
          .insert([{ ...newContact, user_id: user.id }])
          .select()

        if (error) throw error

        setContacts([...contacts, ...data])
        toast.success('Contacto creado')
      }

      handleCloseModal()
    } catch (error) {
      console.error('Error saving contact:', error)
      toast.error(error.message || 'Error al guardar el contacto')
    }
  }

  const handleEditContact = (contact) => {
    setEditingContact(contact)
    setNewContact({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || ''
    })
    setIsModalOpen(true)
  }

  const handleDeleteContact = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
      try {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', id)

        if (error) throw error

        setContacts(contacts.filter(contact => contact.id !== id))
        toast.success('Contacto eliminado')
      } catch (error) {
        console.error('Error deleting contact:', error)
        toast.error('Error al eliminar el contacto')
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingContact(null)
    setNewContact({ name: '', email: '', phone: '' })
  }

  const sortContacts = (items) => {
    return [...items].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  const filteredAndSortedContacts = sortContacts(
    contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.phone && contact.phone.includes(searchTerm))
    )
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Mis Contactos</h1>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                + Nuevo Contacto
              </button>
            </div>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Buscar contactos..."
                className="w-full p-2 border rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
              {['name', 'created_at'].map((key) => (
                <button
                  key={key}
                  onClick={() => setSortConfig(prev => ({
                    key,
                    direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
                  }))}
                  className={`px-3 py-1 text-sm rounded whitespace-nowrap ${
                    sortConfig.key === key
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {key === 'name' ? 'Nombre' : 'Fecha'} 
                  {sortConfig.key === key && (
                    sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredAndSortedContacts.length > 0 ? (
                filteredAndSortedContacts.map((contact) => (
                  <div key={contact.id} className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <h4 className="font-medium">{contact.name}</h4>
                      <p className="text-gray-600">{contact.email}</p>
                      {contact.phone && (
                        <p className="text-gray-600">{contact.phone}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                        title="Editar"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        title="Eliminar"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  {searchTerm ? 'No se encontraron contactos' : 'No hay contactos aún'}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal para agregar/editar contacto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingContact ? 'Editar Contacto' : 'Agregar Nuevo Contacto'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  value={newContact.email}
                  onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="tel"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                >
                  {editingContact ? 'Actualizar' : 'Guardar'} Contacto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
