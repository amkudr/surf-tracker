import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { surfSessionsAPI, spotsAPI, surfboardsAPI } from '../services/api';
import {
  SurfSessionCreate,
  SpotResponse,
  SurfboardResponse,
  SurfSessionReviewCreate,
} from '../types/api';

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
  useTemporaryBoard: boolean;
  isReviewEnabled: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSpotChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleSaveBoardToggle: (checked: boolean) => void;
  handleReviewToggle: (enabled: boolean) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleDelete: () => Promise<void>;
}

export const useSurfSessionForm = (): UseSurfSessionFormReturn => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const defaultReview = (): SurfSessionReviewCreate => ({
    quality: 5,
    crowded_level: 5,
    wave_height_index: 5,
    short_long_index: 5,
    wind_index: 5,
  });

  const [formData, setFormData] = useState<SurfSessionCreate>({
    datetime: (() => {
      const d = new Date();
      d.setHours(8, 0, 0, 0);
      return d.toISOString().slice(0, 19);
    })(),
    duration_minutes: 60,
    notes: '',
    spot_id: undefined,
    spot_name: '',
    review: null,
    surfboard_id: undefined,
    surfboard_name: '',
    surfboard_brand: '',
    surfboard_model: '',
    surfboard_length_ft: undefined,
    surfboard_width_in: undefined,
    surfboard_thickness_in: undefined,
    surfboard_volume_liters: undefined,
    save_surfboard_to_quiver: false,
  });

  const [spots, setSpots] = useState<SpotResponse[]>([]);
  const [surfboards, setSurfboards] = useState<SurfboardResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditing);
  const [error, setError] = useState('');
  const [useTemporaryBoard, setUseTemporaryBoard] = useState(false);
  const [isReviewEnabled, setIsReviewEnabled] = useState(false);

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
              notes: sessionData.notes || '',
              spot_id: sessionData.spot_id,
              spot_name: '',
              review: sessionData.review
                ? {
                    observed_at: sessionData.review.observed_at,
                    quality: sessionData.review.quality,
                    crowded_level: sessionData.review.crowded_level ?? 5,
                    wave_height_index: sessionData.review.wave_height_index ?? 5,
                    short_long_index: sessionData.review.short_long_index ?? 5,
                    wind_index: sessionData.review.wind_index ?? 5,
                  }
                : null,
              surfboard_id: sessionData.surfboard_id,
              surfboard_name: sessionData.surfboard_name || '',
              surfboard_brand: sessionData.surfboard_brand || '',
              surfboard_model: sessionData.surfboard_model || '',
              surfboard_length_ft: sessionData.surfboard_length_ft ?? undefined,
              surfboard_width_in: sessionData.surfboard_width_in ?? undefined,
              surfboard_thickness_in: sessionData.surfboard_thickness_in ?? undefined,
              surfboard_volume_liters: sessionData.surfboard_volume_liters ?? undefined,
              save_surfboard_to_quiver: false,
            });
            setUseTemporaryBoard(!sessionData.surfboard_id && !!sessionData.surfboard_name);
            setIsReviewEnabled(!!sessionData.review);
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
    if (name === 'surfboard_id') {
      if (value === '__other__') {
        setUseTemporaryBoard(true);
        setFormData(prev => ({
          ...prev,
          surfboard_id: undefined,
        }));
        return;
      }
      if (value === '') {
        setUseTemporaryBoard(false);
      }
    }
    const reviewFields: (keyof SurfSessionReviewCreate)[] = [
      'quality',
      'crowded_level',
      'wave_height_index',
      'short_long_index',
      'wind_index',
    ];
    if (reviewFields.includes(name as keyof SurfSessionReviewCreate)) {
      setFormData(prev => {
        const currentReview = prev.review ?? defaultReview();
        return {
          ...prev,
          review: {
            ...currentReview,
            [name]: value === '' ? undefined : parseInt(value),
          } as SurfSessionReviewCreate,
        };
      });
      return;
    }
    const numberFields = [
      'duration_minutes',
      'spot_id',
      'surfboard_id',
    ];
    const floatFields = [
      'surfboard_length_ft',
      'surfboard_width_in',
      'surfboard_thickness_in',
      'surfboard_volume_liters',
    ];
    setFormData(prev => ({
      ...prev,
      [name]:
        numberFields.includes(name)
          ? value === '' ? undefined : parseInt(value)
          : floatFields.includes(name)
            ? value === '' ? undefined : parseFloat(value)
            : value,
    }));
    if (name === 'surfboard_id' && value !== '' && value !== '__other__') {
      setUseTemporaryBoard(false);
      setFormData(prev => ({
        ...prev,
        surfboard_name: '',
        surfboard_brand: '',
        surfboard_model: '',
        surfboard_length_ft: undefined,
        surfboard_width_in: undefined,
        surfboard_thickness_in: undefined,
        surfboard_volume_liters: undefined,
        save_surfboard_to_quiver: false,
      }));
    }
  }, []);

  const handleSpotChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      const spotId = e.target.value === '' ? undefined : parseInt(e.target.value);
      setFormData(prev => ({
          ...prev,
          spot_id: spotId,
          spot_name: spotId ? undefined : prev.spot_name
      }));
  }, []);

  const handleSaveBoardToggle = useCallback((checked: boolean) => {
    setFormData(prev => ({ ...prev, save_surfboard_to_quiver: checked }));
  }, []);

  const handleReviewToggle = useCallback((enabled: boolean) => {
    setIsReviewEnabled(enabled);
    setFormData(prev => ({
      ...prev,
      review: enabled ? (prev.review ?? defaultReview()) : null,
    }));
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const payload: SurfSessionCreate = { ...formData };
    // Normalize blank strings to undefined for optional fields.
    if (payload.notes?.trim() === '') payload.notes = undefined;
    if (payload.spot_name?.trim() === '') payload.spot_name = undefined;
    if (payload.surfboard_name?.trim() === '') payload.surfboard_name = undefined;
    if (payload.surfboard_brand?.trim() === '') payload.surfboard_brand = undefined;
    if (payload.surfboard_model?.trim() === '') payload.surfboard_model = undefined;
    if (payload.spot_id != null) {
      payload.spot_name = undefined;
    }
    if (!isReviewEnabled) {
      payload.review = undefined;
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
    useTemporaryBoard,
    isReviewEnabled,
    handleChange,
    handleSpotChange,
    handleSaveBoardToggle,
    handleReviewToggle,
    handleSubmit,
    handleDelete,
  };
};
