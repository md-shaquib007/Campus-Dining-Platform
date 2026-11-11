import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { onboardingApi } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function OnboardingPage() {
  const [done, setDone] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: '',
      adminEmail: '',
      adminPassword: 'Admin@123',
      adminFirstName: '',
      adminLastName: '',
      hostelName: 'Main Hostel',
      hostelCode: 'MH-1',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => onboardingApi.create(data),
    onSuccess: () => { toast.success('College onboarded!'); setDone(true); },
    onError: () => toast.error('Onboarding failed'),
  });

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-green-600">College Onboarded!</h2>
        <p className="text-muted-foreground mt-2">The college admin can now log in and configure dining halls.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">College Onboarding</h2>
        <p className="text-muted-foreground">Set up a new institution in one step</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Institution Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <Input id="name" label="College Name" {...register('name', { required: true })} />
            <div className="grid grid-cols-2 gap-4">
              <Input id="adminFirstName" label="Admin First Name" {...register('adminFirstName')} />
              <Input id="adminLastName" label="Admin Last Name" {...register('adminLastName')} />
            </div>
            <Input id="adminEmail" label="Admin Email" type="email" {...register('adminEmail')} />
            <Input id="adminPassword" label="Admin Password" type="password" {...register('adminPassword')} />
            <div className="grid grid-cols-2 gap-4">
              <Input id="hostelName" label="Hostel Name" {...register('hostelName')} />
              <Input id="hostelCode" label="Hostel Code" {...register('hostelCode')} />
            </div>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Setting up...' : 'Launch College'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
