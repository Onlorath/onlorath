'use client';

import React from 'react';
import ProjectForm from '../../../../components/ProjectForm';

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Yeni Proje</h1>
        <p className="text-slate-400 mt-1.5 text-sm">Portfolyoya yeni bir sistem modülü ekleyin</p>
      </div>
      <ProjectForm />
    </div>
  );
}
