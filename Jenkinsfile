pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend - Tests') {
            steps {
                sh '''
                    docker run --rm \
                      -v "$WORKSPACE:/app" \
                      -w /app/backend \
                      python:3.12-slim \
                      sh -c "pip install --no-cache-dir -r requirements-test.txt && pytest"
                '''
            }
        }

        stage('Frontend - Install') {
            steps {
                sh '''
                    docker run --rm \
                      -v "$WORKSPACE:/app" \
                      -w /app/frontend \
                      node:20 \
                      npm ci
                '''
            }
        }

        stage('Frontend - Tests') {
            steps {
                sh '''
                    docker run --rm \
                      -v "$WORKSPACE:/app" \
                      -w /app/frontend \
                      node:20 \
                      npm test
                '''
            }
        }

        stage('Frontend - Lint') {
            steps {
                sh '''
                    docker run --rm \
                      -v "$WORKSPACE:/app" \
                      -w /app/frontend \
                      node:20 \
                      npm run lint
                '''
            }
        }

        stage('Frontend - Build') {
            steps {
                sh '''
                    docker run --rm \
                      -v "$WORKSPACE:/app" \
                      -w /app/frontend \
                      node:20 \
                      npm run build
                '''
            }
        }

        stage('Archive Build') {
            steps {
                archiveArtifacts artifacts: 'frontend/dist/**', fingerprint: true
            }
        }
    }

    post {
        success {
            echo 'Pipeline completado: tests y build OK.'
        }

        failure {
            echo 'El pipeline fallo. Revisar la etapa que aparece en rojo.'
        }
    }
}