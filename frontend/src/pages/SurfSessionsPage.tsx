import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { surfSessionsAPI } from '../services/api';
import { SurfSessionResponse } from '../types/api';
import { Card, Button, Loading, Alert, AlertDescription } from '../components/ui';
import { SessionsTable } from '../components/SessionsTable';
import { PageHero } from '../components/PageHero';

const SurfSessionsPage = () => {
  const [sessions, setSessions] = useState<SurfSessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await surfSessionsAPI.getAll();
      const sortedData = [...data].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      setSessions(sortedData);
    } catch (err: any) {
      setError('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this session? This cannot be undone.')) {
      return;
    }
    try {
      await surfSessionsAPI.delete(id);
      setSessions(sessions.filter((s) => s.id !== id));
    } catch (err: any) {
      setError('Failed to delete session');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        title="Sessions"
        subtitle="Manage and track all your surf sessions"
        actions={
          <Link to="/sessions/new">
            <Button variant="primary" size="md">
              Add Session
            </Button>
          </Link>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-0 overflow-hidden">
        <SessionsTable
          sessions={sessions}
          onDelete={handleDelete}
          emptyMessage="No surf sessions yet. Add your first session to get started."
          emptyActionHref="/sessions/new"
          emptyActionLabel="Add Your First Session"
        />
      </Card>
    </div>
  );
};

export default SurfSessionsPage;
