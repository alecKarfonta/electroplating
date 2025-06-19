import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { 
  CloudUpload, 
  FileUpload as FileUploadIcon, 
  ThreeDRotation,
  CheckCircle 
} from '@mui/icons-material';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  loading?: boolean;
  error?: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  loading = false,
  error = null,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.stl'],
      'model/stl': ['.stl'],
    },
    multiple: false,
  });

  return (
    <Box>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#dc2626'
            }
          }}
        >
          {error}
        </Alert>
      )}

      <Box
        {...getRootProps()}
        sx={{
          border: '3px dashed',
          borderColor: loading 
            ? 'success.main' 
            : isDragActive 
              ? '#3730a3' 
              : 'rgba(30, 58, 138, 0.3)',
          borderRadius: 3,
          p: 6,
          cursor: loading ? 'default' : 'pointer',
          background: loading
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'
            : isDragActive 
              ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(55, 48, 163, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isDragActive ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isDragActive 
            ? '0 20px 25px -5px rgba(30, 58, 138, 0.1), 0 10px 10px -5px rgba(30, 58, 138, 0.04)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          '&:hover': loading ? {} : {
            borderColor: '#3730a3',
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.08) 0%, rgba(55, 48, 163, 0.08) 100%)',
            transform: 'scale(1.01)',
            boxShadow: '0 20px 25px -5px rgba(30, 58, 138, 0.1), 0 10px 10px -5px rgba(30, 58, 138, 0.04)',
          },
        }}
      >
        <input {...getInputProps()} />
        
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 3
          }}>
            <Box sx={{ position: 'relative' }}>
              <CircularProgress 
                size={80} 
                sx={{ 
                  color: '#10b981',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }} 
              />
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}>
                <ThreeDRotation sx={{ 
                  fontSize: '2rem', 
                  color: '#10b981',
                  animation: 'spin 2s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  }
                }} />
              </Box>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 600, 
                color: '#065f46',
                mb: 1
              }}>
                Processing Your Model
              </Typography>
              <Typography variant="body1" sx={{ color: '#047857' }}>
                Analyzing geometry and preparing for calculations...
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 3
          }}>
            {isDragActive ? (
              <>
                <Box sx={{ position: 'relative' }}>
                  <CloudUpload sx={{ 
                    fontSize: '5rem', 
                    color: '#3730a3',
                    filter: 'drop-shadow(0 4px 8px rgba(55, 48, 163, 0.3))'
                  }} />
                  <Box sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    }
                  }}>
                    <CheckCircle sx={{ 
                      fontSize: '1.5rem', 
                      color: '#10b981',
                      backgroundColor: 'white',
                      borderRadius: '50%'
                    }} />
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700,
                    color: '#3730a3',
                    mb: 1
                  }}>
                    Drop Your STL File Here
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#4f46e5' }}>
                    Release to upload and analyze
                  </Typography>
                </Box>
              </>
            ) : (
              <>
                <Box sx={{ position: 'relative' }}>
                  <FileUploadIcon sx={{ 
                    fontSize: '5rem', 
                    color: '#64748b',
                    filter: 'drop-shadow(0 4px 8px rgba(100, 116, 139, 0.2))'
                  }} />
                  <ThreeDRotation sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '2rem',
                    color: '#3730a3',
                    opacity: 0.8
                  }} />
                </Box>
                <Box sx={{ textAlign: 'center', maxWidth: '400px' }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700,
                    color: '#1e3a8a',
                    mb: 2
                  }}>
                    Upload Your STL File
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: '#64748b',
                    mb: 3,
                    fontWeight: 400
                  }}>
                    Drag & drop your 3D model here, or click to browse
                  </Typography>
                  <Button 
                    variant="contained" 
                    size="large"
                    sx={{ 
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)',
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 25px -5px rgba(55, 48, 163, 0.4)',
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <CloudUpload sx={{ mr: 1 }} />
                    Choose File
                  </Button>
                </Box>
              </>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        mt: 3
      }}>
        <Chip 
          label="STL Files Only" 
          size="medium"
          sx={{ 
            backgroundColor: 'rgba(30, 58, 138, 0.1)',
            color: '#1e3a8a',
            fontWeight: 500,
            '& .MuiChip-icon': {
              color: '#3730a3'
            }
          }}
          icon={<ThreeDRotation />}
        />
        <Typography variant="body2" color="text.secondary">
          Maximum file size: 50MB
        </Typography>
      </Box>
    </Box>
  );
};

export default FileUpload; 