#### Install node and npm
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
package "git" do
  not_if "git --version"
  guard_interpreter :bash
end
package "python3" do
  not_if "python3 --version"
  guard_interpreter :bash
end
package "python3-pip" do
  not_if "pip3 --version"
  guard_interpreter :bash
end
package "vim" do
  not_if "vim --version"
  guard_interpreter :bash
end

package "python-dev"
package "libxml2-dev"
package "libxslt1-dev"
package "zlib1g-dev"
package "python3-lxml"
package "python3-requests"


# #### npm and python dependencies
execute "Install Forever" do
  command "npm install -g forever"
  not_if "forever --version"
  guard_interpreter :bash
end

execute "Install Bower" do
  command "npm install -g bower"
  not_if "bower -v"
  guard_interpreter :bash
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

file "/lib/systemd/system/mongod.service" do
  content "[Unit]
Description=High-performance, schema-free document-oriented database
After=network.target
Documentation=https://docs.mongodb.org/manual

[Service]
User=mongodb
Group=mongodb
ExecStart=/usr/bin/mongod --quiet --config /etc/mongod.conf

[Install]
WantedBy=multi-user.target"
  not_if "mongo --version"
  guard_interpreter :bash
end

service "mongod" do
  action [:enable, :start]
end
