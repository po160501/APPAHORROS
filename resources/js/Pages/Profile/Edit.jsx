import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { useRef, useState } from 'react';

export default function Edit({ mustVerifyEmail, status, coverImage }) {
    const [preview, setPreview] = useState(coverImage || null);
    const fileInput = useRef(null);
    const { data, setData, post, processing, errors } = useForm({ cover: null });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData('cover', file);
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('profile.cover'), { forceFormData: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                    Mi Perfil
                </h2>
            }
        >
            <Head title="Perfil" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">

                {/* Cover Image */}
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl overflow-hidden shadow-sm">
                    <div
                        className="relative h-40 w-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center"
                        style={preview ? { backgroundImage: `url(${preview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                    >
                        {!preview && (
                            <span className="text-white/60 text-sm font-medium">Sin imagen de fondo</span>
                        )}
                        <div className="absolute inset-0 bg-black/20" />
                        <button
                            onClick={() => fileInput.current?.click()}
                            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 hover:bg-white text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-xl shadow transition-all"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {preview ? 'Cambiar foto' : 'Subir foto'}
                        </button>
                    </div>

                    <div className="p-6">
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">Imagen de Fondo</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                            Esta imagen se usará como fondo en tus tarjetas de cuenta principal.
                        </p>

                        <form onSubmit={handleSubmit} className="flex items-center gap-3">
                            <input
                                ref={fileInput}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <button
                                type="button"
                                onClick={() => fileInput.current?.click()}
                                className="text-xs font-semibold px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Seleccionar imagen
                            </button>
                            {data.cover && (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="text-xs font-bold px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {processing ? 'Guardando...' : 'Guardar'}
                                </button>
                            )}
                            {status === 'cover-updated' && (
                                <span className="text-xs text-emerald-500 font-semibold">¡Guardado!</span>
                            )}
                        </form>
                        {errors.cover && <p className="text-red-500 text-xs mt-2">{errors.cover}</p>}
                    </div>
                </div>

                {/* Profile Info */}
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl p-6 shadow-sm">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                    />
                </div>

                {/* Password */}
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl p-6 shadow-sm">
                    <UpdatePasswordForm />
                </div>

                {/* Delete Account */}
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl p-6 shadow-sm">
                    <DeleteUserForm />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
