import { z } from 'zod';
import CustomForm from './CustomForm';

const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18).max(120),
});

type UserFormData = z.infer<typeof UserSchema>;

const UserFormPage = () => {
  const handleSubmit = async (values: UserFormData) => {
    // Handle form submission
    console.log(values);
    // e.g., send data to an API
  };

  const defaultValues: UserFormData = {
    name: '',
    email: '',
    age: 18,
  };

  return (
    <CustomForm<UserFormData>
      onSubmit={handleSubmit}
      schema={UserSchema}
      defaultValues={defaultValues}
    />
  );
};

export default UserFormPage;
