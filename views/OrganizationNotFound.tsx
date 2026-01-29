import React from 'react';

export const OrganizationNotFound = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2 font-brand">Organization Not Found</h1>
                <p className="text-slate-600 mb-8">
                    The organization URL you are trying to access is invalid or doesn't exist. Please check the subdomain and try again.
                </p>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 italic text-slate-500 text-sm">
                    Please go to the given domain of your organization to continue.
                </div>
            </div>
            <p className="mt-8 text-sm text-slate-400">
                &copy; 2026 Vyahan Intelligent Logistics. All rights reserved.
            </p>
        </div>
    );
};
