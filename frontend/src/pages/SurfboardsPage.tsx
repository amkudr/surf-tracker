import { useEffect, useState } from 'react';
import { surfboardsAPI } from '../services/api';
import { SurfboardResponse, SurfboardCreate } from '../types/api';
import { Plus, Trash2, Ruler, Weight, Edit2 } from 'lucide-react';
import { Card, Button, Input, FormField, EmptyState, SectionTitle, Alert, AlertDescription, PageHero, Loading } from '../components/ui';

const SurfboardsPage = () => {
  const [surfboards, setSurfboards] = useState<SurfboardResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SurfboardCreate>({
    name: '',
    brand: '',
    model: '',
    length_ft: 6,
    volume_liters: 30,
  });

  const fetchSurfboards = async () => {
    try {
      const data = await surfboardsAPI.getAll();
      setSurfboards(data);
    } catch (err: any) {
      setError('Failed to load surfboards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurfboards();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'length_ft' || name === 'volume_liters' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingBoardId) {
        await surfboardsAPI.update(editingBoardId, formData);
      } else {
        await surfboardsAPI.create(formData);
      }
      setShowAddForm(false);
      setEditingBoardId(null);
      setFormData({ name: '', brand: '', model: '', length_ft: 6, volume_liters: 30 });
      fetchSurfboards();
    } catch (err: any) {
      setError(`Failed to ${editingBoardId ? 'update' : 'create'} surfboard`);
      setIsLoading(false);
    }
  };

  const handleEdit = (board: SurfboardResponse) => {
    setFormData({
      name: board.name,
      brand: board.brand || '',
      model: board.model || '',
      length_ft: board.length_ft,
      volume_liters: board.volume_liters,
    });
    setEditingBoardId(board.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingBoardId(null);
    setFormData({ name: '', brand: '', model: '', length_ft: 6, volume_liters: 30 });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this board?')) return;
    try {
      await surfboardsAPI.delete(id);
      fetchSurfboards();
    } catch (err: any) {
      setError('Failed to delete surfboard');
    }
  };

  if (isLoading && surfboards.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        title="Surfboards"
        subtitle="Manage your collection of surfboards and track their performance."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => (showAddForm ? handleCancel() : setShowAddForm(true))}
          >
            {showAddForm ? 'Cancel' : 'Add Surfboard'}
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showAddForm && (
        <Card className="p-6">
          <SectionTitle className="mb-6">{editingBoardId ? 'Edit' : 'Add New'} Surfboard</SectionTitle>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Board Name" required>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. My Daily Driver"
                required
              />
            </FormField>
            <FormField label="Brand">
              <Input
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="e.g. Lost Surfboards"
              />
            </FormField>
            <FormField label="Model">
              <Input
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder="e.g. Driver 2.0"
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Length (ft)" required>
                <Input
                  type="number"
                  name="length_ft"
                  value={formData.length_ft}
                  onChange={handleInputChange}
                  min="1"
                  step="0.1"
                  required
                />
              </FormField>
              <FormField label="Volume (L)" required>
                <Input
                  type="number"
                  name="volume_liters"
                  value={formData.volume_liters}
                  onChange={handleInputChange}
                  min="1"
                  step="0.1"
                  required
                />
              </FormField>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingBoardId ? 'Update' : 'Save'} Board
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {surfboards.map((board) => (
          <Card key={board.id} className="overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-content-primary">{board.name}</h3>
                  <p className="text-content-secondary">
                    {board.brand} {board.model}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(board)}
                    className="text-content-secondary hover:text-accent hover:bg-accent/5"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(board.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-xs text-content-secondary uppercase tracking-wider">Length</p>
                    <p className="font-medium">{board.length_ft}'</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-xs text-content-secondary uppercase tracking-wider">Volume</p>
                    <p className="font-medium">{board.volume_liters}L</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {surfboards.length === 0 && !showAddForm && (
        <EmptyState
          title="No surfboards yet"
          description="Add your boards to track which one works best in different conditions."
          icon={<Plus className="h-12 w-12" />}
          action={{
            label: "Add Your First Board",
            onClick: () => setShowAddForm(true)
          }}
        />
      )}
    </div>
  );
};

export default SurfboardsPage;
