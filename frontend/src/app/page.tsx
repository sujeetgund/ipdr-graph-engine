
'use client';

import { FileUpload } from '@/components/ipdr/file-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, GitGraph } from 'lucide-react';
import { motion } from 'framer-motion';

const CpuIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>
    </svg>
);


const howItWorksSteps = [
    {
        icon: FileUp,
        title: "1. Upload File",
        description: "Start by uploading your log file. The system accepts CSV, JSON, and Excel formats.",
    },
    {
        icon: CpuIcon,
        title: "2. AI Analysis",
        description: "Our backend maps connections and uses an AI model to detect anomalous sessions.",
    },
    {
        icon: GitGraph,
        title: "3. Interactive Graph",
        description: "Explore your data in an interactive 2D/3D graph. Click to investigate findings.",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100
        }
    }
};


export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-auto">
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h1 className="font-headline font-bold text-2xl md:text-3xl">Dashboard</h1>
        </motion.div>
        
        <motion.div 
            className="grid gap-6 md:grid-cols-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="md:col-span-12" variants={itemVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle>New Analysis</CardTitle>
                        <CardDescription>Upload an IPDR log file to begin analysis and visualization.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FileUpload />
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div className="md:col-span-12" variants={itemVariants}>
                 <Card>
                    <CardHeader>
                        <CardTitle>How It Works</CardTitle>
                         <CardDescription>A simple, powerful three-step process.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                        {howItWorksSteps.map((step, i) => (
                            <motion.div 
                                key={i} 
                                className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50"
                                whileHover={{ scale: 1.05, y: -5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <div className="flex h-16 w-16 mb-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" 
                                     style={{
                                        boxShadow: '0 0 20px hsl(var(--primary)/0.5), inset 0 0 8px hsl(var(--primary)/0.3)',
                                     }}>
                                    <step.icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                                <p className="text-muted-foreground text-sm">{step.description}</p>
                            </motion.div>
                        ))}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    </main>
  );
}
