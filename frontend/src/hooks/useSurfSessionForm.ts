import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { surfSessionsAPI, spotsAPI, surfboardsAPI } from '../services/api';
import { SurfSessionCreate, SpotResponse, SurfboardResponse } from '../types/api';

interface UseSurfSessionFormReturn {
  formData: SurfSessionCreate;
  spots: SpotResponse[];
  surfboards: SurfboardResponse[];
  isLoading: boolean;
  isLoadingData: boolean;
  error: string;
  isEditing: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSpotChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleDelete: () => Promise<void>;
}

export const useSurfSessionForm = (): UseSurfSessionFormReturn => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState<SurfSessionCreate>({
    datetime: (() => {
      const d = new Date();
      d.setHours(8, 0, 0, 0);
      return d.toISOString().slice(0, 19);
    })(),
    duration_minutes: 60,
    wave_quality: 5,
    notes: '',
    spot_id: undefined,
    spot_name: '',
    surfboard_id: undefined,
  });

  const [spots, setSpots] = useState<SpotResponse[]>([]);
  const [surfboards, setSurfboards] = useState<SurfboardResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditing);
  const [error, setError] = useState('');

  // Fetch initial data
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [spotsData, surfboardsData] = await Promise.all([
          spotsAPI.getAll(),
          surfboardsAPI.getAll()
        ]);
        
        if (!isMounted) return;
        setSpots(spotsData);
        setSurfboards(surfboardsData);

        if (isEditing && id) {
          const sessionData = await surfSessionsAPI.getById(parseInt(id));
          if (isMounted) {
            setFormData({
              datetime: sessionData.datetime.slice(0, 19),
              duration_minutes: sessionData.duration_minutes,
              wave_quality: sessionData.wave_quality,
              notes: sessionData.notes || '',
              spot_id: sessionData.spot_id,
              spot_name: '',
              surfboard_id: sessionData.surfboard_id,
            });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Failed to load data');
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, isEditing]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'date') {
      setFormData(prev => ({ ...prev, datetime: value + prev.datetime.slice(10) }));
      return;
    }
    if (name === 'time') {
      setFormData(prev => ({ ...prev, datetime: prev.datetime.slice(0, 11) + value + ':00' }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_minutes' || name === 'wave_quality' || name === 'spot_id' || name === 'surfboard_id'
        ? (value === '' ? undefined : parseInt(value))
        : value,
    }));
  }, []);

  const handleSpotChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      const spotId = e.target.value === '' ? undefined : parseInt(e.target.value);
      setFormData(prev => ({
          ...prev,
          spot_id: spotId,
          spot_name: spotId ? undefined : prev.spot_name
      }));
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const payload: SurfSessionCreate = { ...formData };
    if (payload.spot_id != null) {
      payload.spot_name = undefined;
    }

    try {
      if (isEditing && id) {
        await surfSessionsAPI.update(parseInt(id), payload);
      } else {
        await surfSessionsAPI.create(payload);
      }
      navigate('/sessions');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    if (id) {
      try {
        await surfSessionsAPI.delete(parseInt(id));
        navigate('/sessions');
      } catch (err: any) {
        setError('Failed to delete session');
      }
    }
  };

  return {
    formData,
    spots,
    surfboards,
    isLoading,
    isLoadingData,
    error,
    isEditing,
    handleChange,
    handleSpotChange,
    handleSubmit,
    handleDelete,
  };
};
