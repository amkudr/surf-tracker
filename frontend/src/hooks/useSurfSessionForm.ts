import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { surfSessionsAPI, spotsAPI, surfboardsAPI } from '../services/api';
import { SurfSessionCreate, SpotResponse, SurfboardResponse } from '../types/api';

const pad2 = (n: number) => String(n).padStart(2, '0');

function normalizeDatetime(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setHours(8, 0, 0, 0);
    return fallback.toISOString().slice(0, 19);
  }
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function getDatePart(datetime: string): string {
  const normalized = normalizeDatetime(datetime);
  return normalized.slice(0, 10);
}

function getTimePart(datetime: string): string {
  const normalized = normalizeDatetime(datetime);
  return normalized.slice(11, 16);
}

function formatValidationError(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (typeof d === 'object' && d != null && 'msg' in d ? String((d as { msg: unknown }).msg) : String(d)))
      .join('. ');
  }
  return 'Failed to save session';
}

interface UseSurfSessionFormReturn {
  formData: SurfSessionCreate;
  dateForInput: string;
  timeForInput: string;
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
              datetime: normalizeDatetime(sessionData.datetime),
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
      setFormData(prev => ({ ...prev, datetime: value + 'T' + getTimePart(prev.datetime) + ':00' }));
      return;
    }
    if (name === 'time') {
      setFormData(prev => ({ ...prev, datetime: getDatePart(prev.datetime) + 'T' + value + ':00' }));
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
      const detail = err.response?.data?.detail;
      setError(detail != null ? formatValidationError(detail) : 'Failed to save session');
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
    dateForInput: getDatePart(formData.datetime),
    timeForInput: getTimePart(formData.datetime),
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
