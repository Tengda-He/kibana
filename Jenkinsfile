node('test') {
    def kibanaVersion = '6.7.2'
    def scmVars = checkout scm
    sh "env"
    def imageName = "${env.BRANCH_NAME}-test-image:${env.BUILD_ID}"
    def testImage

    stage('Build container image') {
        sh 'ls -l'
        sh 'docker -v'
        testImage = docker.build imageName
    }

    try {
        testImage.inside {
            sh 'uname -a'
            env.NODE_OPTIONS = '--max_old_space_size=8192'
            env.TEST_BROWSER_HEADLESS=1
            env.KIBANA_DIR=sh(script: 'pwd', , returnStdout: true).trim()
            sh 'which npm'
            sh 'npm --version'
            sh 'rm -rf target/junit'
            sh 'rm -rf junit-test'
            sh 'mkdir junit-test'

            stage('Bootstrap') {
                sh 'yarn add --dev jest-junit@10.0.0'
                sh 'google-chrome --version'
                sh 'yarn kbn bootstrap'
            }

            stage('Run ES'){
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'bfs-jenkins',
                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                ]]) {
                    sh 'aws s3 cp s3://kibana.bfs.vendor/aes/elasticsearch/elasticsearch-oss-6.7.2.tar.gz ./'
                    echo 'Start Elasticsearch'
                    sh 'tar -xf elasticsearch-oss-6.7.2.tar.gz'
                    sh './elasticsearch-6.7.2/bin/elasticsearch &'
                } 
            }
            
            stage("Run Kibana") {
                echo "Starting Kibana..."
                sh "./bin/kibana --no-base-path 2>&1 | tee kibana.log &"
            }

            // stage('Unit Test') {
            //     echo "Starting unit test..."
            //     def utResult = sh returnStatus: true, script: 'CI=1 GCS_UPLOAD_PREFIX=fake yarn test:jest -u --ci'

            //     if (utResult != 0) {
            //         currentBuild.result = 'FAILURE'
            //     }

            //     junit 'target/junit/TEST-Jest Tests*.xml'
            // }

            // stage('Integration Test') {
            //     echo "Start Integration Tests"
            //     def itResult = sh returnStatus: true, script: 'CI=1 GCS_UPLOAD_PREFIX=fake node scripts/jest_integration -u --ci'

            //     if (itResult != 0) {
            //         currentBuild.result = 'FAILURE'
            //     }

            //     junit 'target/junit/TEST-Jest Integration Tests*.xml'
            // }

            //  stage("Run Functional Test") {
            //     sh "sleep 120"
            //     sh "curl localhost:9200"
            //     sh "curl localhost:5601"
            //     echo "Start Functional Tests"
                
            //     withEnv([
            //         "TEST_BROWSER_HEADLESS=1",
            //         "CI=1",
            //         "TEST_ES_PORT=9200",
            //         "TEST_KIBANA_PORT=5601",
            //         "TEST_KIBANA_PROTOCOL=http",
            //         "TEST_ES_PROTOCOL=http",
            //         "TEST_KIBANA_HOSTNAME=localhost",
            //         "TEST_ES_HOSTNAME=localhost"
            //     ]) {
                
            //         def utResult = sh returnStatus: true, script: 'CI=1 GCS_UPLOAD_PREFIX=fake node scripts/functional_test_runner'
    
            //         if (utResult != 0) {
            //             currentBuild.result = 'FAILURE'
            //         }

            //         junit 'target/junit/ci*/**.xml'
            //     }
            // }

        }  
        stage('Functional Test') {
            functionalDynamicParallelSteps(testImage);

            junit 'target/junit/ci*/*.xml'
        }
    } catch (e) {
        echo 'This will run only if failed'
        currentBuild.result = 'FAILURE'
        throw e
    }
}

def functionalDynamicParallelSteps(image){
    ciGroupsMap = [:]
    for (int i = 1; i <= 12; i++) {
        def currentCiGroup = "ciGroup${i}";
        def currentStep = i;
        ciGroupsMap["${currentCiGroup}"] = {
            stage("${currentCiGroup}") {
                withEnv([
                    "TEST_BROWSER_HEADLESS=1",
                    "CI=1",
                    "GCS_UPLOAD_PREFIX=fake",
                    "TEST_ES_PORT=9200",
                    "TEST_KIBANA_PORT=5601",
                    "TEST_ES_PROTOCOL=http",
                    "TEST_KIBANA_PROTOCOL=http",
                    "TEST_KIBANA_HOSTNAME=localhost",
                    "TEST_ES_HOSTNAME=localhost",
                ]) {
                    image.inside {
                        sh "node scripts/functional_test_runner --config test/functional/config.js --include ${currentCiGroup}"
                    }
                }
            }
        }
    }
    parallel ciGroupsMap
}

