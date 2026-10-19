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
                      -v jenkins_home:/var/jenkins_home \
                      -w "$WORKSPACE/backend" \
                      python:3.12-slim \
                      sh -c "pip install --no-cache-dir -r requirements-test.txt && TESTING=1 PYTHONPATH=. pytest"
                '''
            }
        }

        stage('Frontend - Install') {
            steps {
                sh '''
                    docker run --rm \
                      -v jenkins_home:/var/jenkins_home \
                      -w "$WORKSPACE/frontend" \
                      node:20 \
                      npm ci
                '''
            }
        }

        stage('Frontend - Tests') {
            steps {
                sh '''
                    docker run --rm \
                      -v jenkins_home:/var/jenkins_home \
                      -w "$WORKSPACE/frontend" \
                      node:20 \
                      npm test
                '''
            }
        }

        stage('Frontend - Lint') {
            steps {
                sh '''
                    docker run --rm \
                      -v jenkins_home:/var/jenkins_home \
                      -w "$WORKSPACE/frontend" \
                      node:20 \
                      npm run lint
                '''
            }
        }

        stage('Frontend - Build') {
            steps {
                sh '''
                    docker run --rm \
                      -v jenkins_home:/var/jenkins_home \
                      -w "$WORKSPACE/frontend" \
                      node:20 \
                      npm run build
                '''
            }
        }

        stage('Docker - Build Images') {
            steps {
                sh '''
                    docker run --rm \
                      -v jenkins_home:/var/jenkins_home \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -e BUILD_NUMBER="$BUILD_NUMBER" \
                      -e GIT_COMMIT="$GIT_COMMIT" \
                      -e WORKSPACE="$WORKSPACE" \
                      docker:27-cli \
                      sh -c '
                        set -e

                        docker build \
                          -t orden-fabricacion-backend:ci-${BUILD_NUMBER} \
                          -t orden-fabricacion-backend:ci-${GIT_COMMIT} \
                          "$WORKSPACE/backend"

                        docker build \
                          -t orden-fabricacion-frontend:ci-${BUILD_NUMBER} \
                          -t orden-fabricacion-frontend:ci-${GIT_COMMIT} \
                          "$WORKSPACE/frontend"
                      '
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
            echo 'Pipeline completado: tests, build e imagenes Docker OK.'
        }

        failure {
            echo 'El pipeline fallo. Revisar la etapa que aparece en rojo.'
        }
    }
}