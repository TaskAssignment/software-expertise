#### Install node and npm
print node
NODE_SOURCE = "/tmp/setup_node.sh"
remote_file NODE_SOURCE do
  source "https://deb.nodesource.com/setup_6.x"
  mode "0755"
  not_if "nodejs -v"
  guard_interpreter :bash
end

package "build-essential" do
  not_if "nodejs -v"
  guard_interpreter :bash
end

execute NODE_SOURCE do
  not_if "nodejs -v"
  guard_interpreter :bash
end

package "nodejs" do
  not_if "nodejs -v"
  guard_interpreter :bash
end


#### General dependencies and goodies
package "git"
package "python3"
package "python3-pip"
package "python-dev"
package "libxml2-dev"
package "libxslt1-dev"
package "zlib1g-dev"
package "python3-lxml"
package "python3-requests"
package "vim"


# #### npm and python dependencies
execute "Install Forever" do
  command "npm install -g forever bower"
  not_if "forever --version"
  guard_interpreter :bash
end

execute "Install Bower" do
  command "npm install -g bower"
  not_if "bower -v"
  guard_interpreter :bash
end

execute "Install python dependencies" do
  command "pip3 install -r packages/custom/expertise/server/bugzilla-python/requirements.txt"
  cwd "/vagrant"
  ignore_failure true
end

execute "Install app dependencies" do
  command "npm install"
  cwd "/vagrant"
  ignore_failure true
  not_if { Dir.exists?('/vagrant/node_modules') }
  environment ({'HOME' => '/home/vagrant', 'USER' => 'vagrant'})
end

execute "Install module dependencies" do
  command "npm install"
  cwd "/vagrant/packages/custom/expertise/"
  ignore_failure true
  not_if { Dir.exists?('/vagrant/packages/custom/expertise/node_modules') }
  environment ({'HOME' => '/home/vagrant', 'USER' => 'vagrant'})
end


#### Mongodb
file "/etc/apt/sources.list.d/mongodb-org-3.2.list" do
  content "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse"
  not_if "mongo --version"
  guard_interpreter :bash
end

apt_update "Update ubuntu mirrors" do
  not_if "mongo --version"
  guard_interpreter :bash
end

package "mongodb-org" do
  options "-y --allow-unauthenticated"
  not_if "mongo --version"
  guard_interpreter :bash
end

directory "/home/vagrant/mongodb"
directory "/home/vagrant/mongodb/logs"
directory "/home/vagrant/mongodb/data"


file "/lib/systemd/system/mongod.service" do
  content "[Unit]
Description=High-performance, schema-free document-oriented database
After=network.target
Documentation=https://docs.mongodb.org/manual

[Service]
User=mongodb
Group=mongodb
ExecStart=mongod --dbpath /home/vagrant/mongodb/data --logpath /home/vagrant/mongodb/logs/log

[Install]
WantedBy=multi-user.target"
  not_if "mongo --version"
  guard_interpreter :bash
end

service "mongod" do
  action [:enable, :start]
end
