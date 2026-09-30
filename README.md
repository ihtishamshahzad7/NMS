[RoutingNMS][]
===========

[RoutingNMS][] is an open-source network monitoring platform that helps you visualize and monitor everything on your local and distributed networks. RoutingNMS offers comprehensive fault, performance, and traffic monitoring with alarm generation in one place. Highly customizable and scalable, RoutingNMS integrates with your core business applications and workflows.

The backend is a proven, feature-complete Java monitoring engine (built on the OpenNMS Horizon core); `frontend/` is a modern React + Next.js UI built specifically for RoutingNMS on top of that engine's REST API.


Features
---------

* **Full inventory management**

	Flexible provisioning system provides many ways to interoperate with configuration management systems.

* **Extensive data collection**

	Works with many industry-standard data collection protocols with no need to write or maintain third-party plugins: SNMP, JSON, WinRM, XML, SQL, JMX, SFTP, FTP, JDBC, HTTP, HTTPS, VMware, WS-Management, Prometheus.

* **Robust traffic management**

	Supports the following flow protocols: (NetFlow v5/v9, IPFIX, sFlow). 300,000+ flows/sec. BGP Monitoring support implementing the OpenBMP standards for BGP messages and metrics. Deep-dive analysis, enterprise reporting.

* **Digital experience monitoring**

	 Use the RoutingNMS Minion to monitor a service's latency and availability from different perspectives.

* **Robust configuration**

	Configure most features through the web UI or XML scripting, including thresholding, provisioning, event and flow management, service monitoring, and performance measurement.

* **Scalability**

	Scale through Sentinels for flow persistence, Minions for Flow, BMP, SNMP trap, and Syslog ingest, and embedded ActiveMQ to Kafka message brokers.

* **Enterprise reporting and visualization**

	Customizable dashboards that you can export as a PDF. Resource graphs, database reports, charts. Define and customize complex layered topologies to integrate topology maps into your service problem management workflow.

* **Modern web UI**

	A dedicated React/Next.js frontend (`frontend/`) — Dashboard, Nodes, Alarms, Events, Outages, Resource Graphs, Topology, and Provisioning — talking to the same backend over its REST API. See [frontend/README.md](frontend/README.md).

Install RoutingNMS
==================

For details on installing the backend engine, see [Install RoutingNMS][].

TL;DR - If you just want to set up a simple non-production evaluation on Linux, some basic install scripts are available at [opennms-forge/opennms-install](https://github.com/opennms-forge/opennms-install)

Build RoutingNMS
================

For details on how to build the backend from source, see [Build RoutingNMS from source][].

[RoutingNMS]:           http://www.opennms.com/
[Build RoutingNMS from source]:  docs/modules/development/pages/build-from-source.adoc
[Install RoutingNMS]:  docs/modules/deployment/pages/core/getting-started.adoc
