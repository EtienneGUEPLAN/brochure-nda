import React, { useState } from 'react';
import { Shield, FileText, Mail, Building2, User, CheckCircle2 } from 'lucide-react';
import logo from './G.png';
import './pixelCanvas.js';
import './styles/button.css';
import { submitNDA, checkExistingNDA, type NDASubmission } from './lib/supabase';

// Ajout de la déclaration TypeScript pour l'élément personnalisé 'pixel-canvas'
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'pixel-canvas': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

function App() {
  const [formData, setFormData] = useState({
    companyName: '',
    representativeName: '',
    email: '',
    ndaAccepted: false
  });
  
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showBrochure, setShowBrochure] = useState(false);
  type Errors = {
    companyName?: string;
    representativeName?: string;
    email?: string;
    ndaAccepted?: string;
  };
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [existingSubmission, setExistingSubmission] = useState<any>(null);

  const projectName = "QBot par F&G - Projet Confidentiel";

  const validateForm = () => {
    const newErrors: Errors = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Le nom de la société est obligatoire';
    }
    
    if (!formData.representativeName.trim()) {
      newErrors.representativeName = 'Le nom du représentant est obligatoire';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email professionnel est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!formData.ndaAccepted) {
      newErrors.ndaAccepted = 'Vous devez accepter les conditions de confidentialité';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form Data:", formData); // Check form data
    console.log("ndaAccepted value:", formData.ndaAccepted); // Check ndaAccepted value
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Vérifier si l'email a déjà soumis un NDA
      const existing = await checkExistingNDA(formData.email);
      
      if (existing) {
        setExistingSubmission(existing);
        setFormSubmitted(true);
        setTimeout(() => {
          setShowBrochure(true);
        }, 1000);
        return;
      }

      // Collecter des informations supplémentaires pour la traçabilité
      const submissionData: Omit<NDASubmission, 'id' | 'created_at' | 'updated_at'> = {
        company_name: formData.companyName,
        representative_name: formData.representativeName,
        email: formData.email,
        project_name: projectName,
        ip_address: '', // Sera rempli côté serveur si nécessaire
        user_agent: navigator.userAgent
      };

      // Soumettre à Supabase
      const result = await submitNDA(submissionData);
      console.log('NDA soumis avec succès:', result);

      setFormSubmitted(true);
      
      // Show brochure after a brief delay for better UX
      setTimeout(() => {
        setShowBrochure(true);
      }, 1000);

    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setSubmitError('Une erreur est survenue lors de la soumission. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      companyName: '',
      representativeName: '',
      email: '',
      ndaAccepted: false
    });
    setFormSubmitted(false);
    setShowBrochure(false);
    setErrors({});
    setSubmitError('');
    setExistingSubmission(null);
  };

  if (showBrochure) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gray-900 text-gray-200">
        <pixel-canvas
          data-colors="#1a1a1a,#2d2d2d,#3a3a3a"
          data-gap="8"
          data-speed="20"
          className="fixed inset-0 w-screen h-screen z-0 pointer-events-none"
        ></pixel-canvas>
        <div className="container mx-auto px-8 py-12 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-800 bg-opacity-50 rounded-3xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-8 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <img src={logo} alt="Logo" className="h-12 w-12 rounded-full" />
                    <div>
                      <h1 className="text-3xl font-semibold">Brochure Projet Confidentiel</h1>
                      <p className="text-gray-300 mt-1">Accès exclusif pour {formData.companyName}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="bg-gray-700 hover:bg-gray-600 text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-300"
                  >
                    Nouveau Formulaire
                  </button>
                </div>
              </div>

              <div className="p-10">
                <div className="bg-gray-700 bg-opacity-30 rounded-xl p-8 mb-10">
                  <div className="flex items-center space-x-4 text-green-400">
                    <CheckCircle2 className="h-6 w-6" />
                    <div>
                      <h3 className="font-semibold text-xl">
                        {existingSubmission ? 'NDA Déjà Validé' : 'NDA Validé avec Succès'}
                      </h3>
                      <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                        {existingSubmission 
                          ? `Accord déjà signé le ${new Date(existingSubmission.created_at).toLocaleDateString('fr-FR')} pour ${existingSubmission.company_name}`
                          : `Signature électronique confirmée le ${new Date().toLocaleDateString('fr-FR')} par ${formData.representativeName} pour ${formData.companyName}`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Brochure Content Area */}
                <div className="bg-gray-700 bg-opacity-30 rounded-xl p-10 min-h-[700px]">
                  <div className="text-center mb-8">
                    <FileText className="h-16 w-16 text-gray-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-semibold text-gray-200 mb-6 tracking-tight">
                      {projectName}
                    </h2>
                    <p className="text-gray-400 text-lg mb-8">
                      Accès à la brochure exclusive du projet
                    </p>
                  </div>

                  {/* PDF Display */}
                  <div className="bg-gray-800 bg-opacity-50 rounded-xl overflow-hidden">
                    <iframe
                      src="brochure.pdf"
                      width="100%"
                      height="650px"
                      className="border-0"
                      title="Brochure Projet Confidentiel"
                    >
                      <p className="p-6 text-gray-400 text-center">Navigateur incompatible avec les PDF.
                        <a href="brochure.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                          Télécharger le PDF
                        </a>
                      </p>
                    </iframe>
                  </div>
                </div>

                <div className="mt-10 p-8 bg-gray-700 bg-opacity-30 rounded-xl">
                  <div className="flex items-start space-x-4">
                    <Shield className="h-6 w-6 text-gray-500" />
                    <div className="text-gray-300">
                      <h4 className="font-semibold text-xl mb-3">Rappel de Sécurité</h4>
                      <p className="text-sm leading-relaxed">
                        Toutes les données sont hautement confidentielles. Engagement de 5 ans.
                        Toute violation entraînera des actions légales immédiates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-900 text-gray-200">
      <pixel-canvas
        data-colors="#1a1a1a,#2d2d2d,#3a3a3a"
        data-gap="8"
        data-speed="20"
        className="fixed inset-0 w-screen h-screen z-0 pointer-events-none"
      ></pixel-canvas>
      <div className="container mx-auto px-8 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 bg-opacity-50 rounded-3xl overflow-hidden shadow-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-8 rounded-t-3xl">
              <div className="flex items-center space-x-6">
                <img src={logo} alt="Logo" className="h-12 w-12 rounded-full" />
                <div>
                  <h1 className="text-3xl font-semibold">Accord de Confidentialité (NDA)</h1>
                  <p className="text-gray-300 mt-1">Portail d'accès sécurisé</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-10">
              {!formSubmitted ? (
                <>
                  {/* Intro Text */}
                  <div className="bg-gray-700 bg-opacity-30 rounded-xl p-8 mb-10">
                    <h2 className="text-xl font-semibold text-gray-200 mb-4">Accès et Confidentialité – Projet QBot</h2>
                    <div className="text-gray-300 leading-relaxed space-y-4">
                      <p>
                        L'accès au projet QBot, réservé exclusivement à F&G, est <strong className="text-gray-200">strictement confidentiel</strong>.
                      </p>
                      <p>
                        Toutes les informations, documents, données ou connaissances transmises ou générées dans le cadre de ce projet sont considérées comme des <strong className="text-gray-200">informations confidentielles</strong>.
                      </p>
                      <p>
                        Leur divulgation, reproduction, utilisation ou communication, totale ou partielle, à toute personne non autorisée est <strong className="text-red-400">formellement interdite</strong>.
                      </p>
                      <p>
                        Les parties s'engagent à respecter cette obligation de confidentialité pour une durée de <strong className="text-gray-200">cinq (5) ans</strong> à compter de la date d'accès aux informations. Toute violation pourra entraîner des <strong className="text-red-400">conséquences légales</strong>.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Name */}
                    <div>
                      <label htmlFor="companyName" className="block text-base font-medium text-gray-300 mb-2">
                        <Building2 className="inline h-5 w-5 mr-2" />
                        Société / Organisation *
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="w-full px-5 py-3 rounded-lg bg-gray-800 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-colors duration-300"
                        placeholder="Votre société" />
                      {errors.companyName && (
                        <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>
                      )}
                    </div>

                    {/* Representative Name */}
                    <div>
                      <label htmlFor="representativeName" className="block text-base font-medium text-gray-300 mb-2">
                        <User className="inline h-5 w-5 mr-2" />
                        Représentant *
                      </label>
                      <input
                        type="text"
                        id="representativeName"
                        name="representativeName"
                        value={formData.representativeName}
                        onChange={handleInputChange}
                        className="w-full px-5 py-3 rounded-lg bg-gray-800 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-colors duration-300"
                        placeholder="Prénom et nom" />
                      {errors.representativeName && (
                        <p className="mt-1 text-sm text-red-500">{errors.representativeName}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-base font-medium text-gray-300 mb-2">
                        <Mail className="inline h-5 w-5 mr-2" />
                        Email Professionnel *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-5 py-3 rounded-lg bg-gray-800 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-colors duration-300"
                        placeholder="email@entreprise.com" />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>

                    {/* NDA Acceptance */}
                    <div className="bg-gray-700 bg-opacity-30 rounded-xl p-8">
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          id="ndaAccepted"
                          name="ndaAccepted"
                          checked={formData.ndaAccepted}
                          onChange={handleInputChange}
                          className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 transition-colors duration-300" />
                        <label htmlFor="ndaAccepted" className="text-gray-300 font-medium cursor-pointer text-lg leading-relaxed">
                          J'accepte les termes de confidentialité. Engagement légal de 5 ans.
                        </label>
                      </div>
                      {errors.ndaAccepted && (
                        <p className="mt-1 text-sm text-red-500 ml-7">{errors.ndaAccepted}</p>
                      )}
                    </div>

                    {/* Submit Error */}
                    {submitError && (
                      <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-xl p-4">
                        <p className="text-red-400 text-sm">{submitError}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Traitement en cours...</span>
                        </div>
                      ) : (
                        'Valider et Accéder'
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-3">Validation en cours...</h3>
                  <p className="text-gray-500 text-lg">Vérification de votre NDA</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-700 bg-opacity-30 px-10 py-6 rounded-b-3xl">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <p className="font-medium">© 2024 - Sécurité NDA</p>
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Protection Avancée</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;