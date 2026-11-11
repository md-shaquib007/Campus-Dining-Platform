import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authApi } from '@/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/layouts/DashboardLayout';

const schema = z.object({ email: z.string().email() });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
      toast.success('Reset link sent if email exists');
    } catch {
      toast.error('Something went wrong');
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Forgot password</h2>
          <p className="text-muted-foreground mt-1">We'll send you a reset link</p>
        </div>
        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Check your email for the reset link.</p>
            <Link to="/login"><Button variant="outline">Back to login</Button></Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input id="email" label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Button type="submit" className="w-full">Send reset link</Button>
            <Link to="/login" className="block text-center text-sm text-primary hover:underline">Back to login</Link>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
